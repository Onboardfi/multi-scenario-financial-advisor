"use client"
import React, { useMemo, useState, useEffect } from "react"
import { Workflow, WorkflowStep } from "@/models/models"
import { fetchEventSource } from "@microsoft/fetch-event-source"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { TbBolt } from "react-icons/tb"
import { v4 as uuidv4 } from "uuid"
import { Profile } from "@/types/profile"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import Message from "@/components/message"
import FunctionCalls from "./function-calls"
import LLMDialog from "./llm-dialog"
import PromptForm from "./prompt-form"
import StockChart from "@/components/tradingview/stock-chart"

interface FunctionCallData {
  function: string;
  args: {
    toggle: string;
  };
}

dayjs.extend(relativeTime)
const defaultFunctionCalls = [
  {
    type: "start",
  },
]

export default function Chat({
  profile,
  llms,
}: {
  profile: Profile
  llms: any
}) {
  const [workflow, setWorkflow] = React.useState<Workflow | null>(null)
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [messages, setMessages] = React.useState<
    {
      type: string
      message: string
      steps?: Record<string, string>
      isSuccess?: boolean
    }[]
  >([])
  const [functionCalls, setFunctionCalls] = React.useState<any[]>()
  const endOfMessagesRef = React.useRef<HTMLDivElement | null>(null)
  const [timer, setTimer] = React.useState<number>(0)
  const [session, setSession] = React.useState<string | null>(uuidv4())
  const [open, setOpen] = React.useState<boolean>(false)
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()
  const abortControllerRef = React.useRef<AbortController | null>(null)

  useEffect(() => {
    async function fetchWorkflow() {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPERAGENT_API_URL}/workflows/${process.env.NEXT_PUBLIC_WORKFLOW_ID}`, {
        headers: {
          authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPERAGENT_API_KEY}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setWorkflow(data.data);
        if (data.data.steps[0]?.agent?.initialMessage) {
          setMessages([{ type: "ai", message: data.data.steps[0].agent.initialMessage }]);
        }
      }
    }
    fetchWorkflow();
  }, []);

  const resetState = () => {
    setIsLoading(false)
    setTimer(0)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const abortStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    resetState()
  }

  const [linkType, setLinkType] = useState<string>('');

  const handleToggleLink = (data: { function: string; args: string }) => {
    console.log('Received function call data:', data);
    try {
      const args = JSON.parse(data.args);
      const newLinkType = args.toggle.toUpperCase();
      if (newLinkType) {
        console.log(`Toggling to stock: ${newLinkType}`);
        setLinkType(newLinkType);
        console.log(`linkType state updated to: ${newLinkType}`);
      } else {
        console.error('No stock symbol specified in the function call data');
      }
    } catch (error) {
      console.error('Error parsing function call args:', error);
    }
  };

  React.useEffect(() => {
    console.log("Rendering StockChart with props:", linkType);
  }, [linkType]);

  async function onSubmit(value?: string) {
    let messageByEventIds: Record<string, string> = {}
    let currentEventId = ""

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()

    setIsLoading(true)

    setTimer(0)
    timerRef.current = setInterval(() => {
      setTimer((prevTimer) => prevTimer + 0.1)
    }, 100)

    setMessages((previousMessages: any) => [
      ...previousMessages,
      { type: "human", message: value },
    ])

    setMessages((previousMessages) => [
      ...previousMessages,
      { type: "ai", message: "" },
    ])

    try {
      await fetchEventSource(
        `${process.env.NEXT_PUBLIC_SUPERAGENT_API_URL}/workflows/${process.env.NEXT_PUBLIC_WORKFLOW_ID}/invoke`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPERAGENT_API_KEY}`,
          },
          body: JSON.stringify({
            input: value,
            enableStreaming: true,
            sessionId: session,
          }),
          openWhenHidden: true,
          signal: abortControllerRef.current.signal,
          async onopen() {
            setFunctionCalls(defaultFunctionCalls)
          },
          async onclose() {
            setFunctionCalls((previousFunctionCalls = []) => [
              ...previousFunctionCalls,
              {
                type: "end",
              },
            ])
            resetState()
            console.log("Message sent. Current linkType:", linkType);
          },
          async onmessage(event) {
            console.log("Raw event:", event);
            if (event.id) currentEventId = event.id;
            try {
              if (event.event === "function_call") {
                console.log("Raw event data:", event.data);
                // Step 1: Replace single quotes with double quotes for the outer JSON structure
                let data = event.data.replace(/'/g, '"');
                // Step 2: Escape the double quotes inside the `args` value
                data = data.replace(/"args": "({.*?})"/, (match, p1) => {
                  return `"args": "${p1.replace(/"/g, '\\"')}"`;
                });
                const parsedData = JSON.parse(data);
                console.log("Parsed function call data:", parsedData);
                if (parsedData.function === "dotoggle") {
                  handleToggleLink(parsedData);
                }
              } else if (event.event === "error") {
                setMessages((previousMessages) => {
                  let updatedMessages = [...previousMessages];
                  for (let i = updatedMessages.length - 1; i >= 0; i--) {
                    if (updatedMessages[i].type === "ai") {
                      updatedMessages[i].message = event.data;
                      updatedMessages[i].isSuccess = false;
                      break;
                    }
                  }
                  return updatedMessages;
                });
              } else if (event.data !== "[END]" && currentEventId) {
                if (!messageByEventIds[currentEventId])
                  messageByEventIds[currentEventId] = "";
                messageByEventIds[currentEventId] +=
                  event.data === "" ? `${event.data} \n` : event.data;
                setMessages((previousMessages) => {
                  let updatedMessages = [...previousMessages];
                  for (let i = updatedMessages.length - 1; i >= 0; i--) {
                    if (updatedMessages[i].type === "ai") {
                      updatedMessages[i].steps = messageByEventIds;
                      break;
                    }
                  }
                  return updatedMessages;
                });
              }
            } catch (error) {
              console.error("Error processing event:", error);
              console.log("Problematic event data:", event.data);
              // Optionally, update the UI to show an error occurred
              setMessages((previousMessages) => {
                let updatedMessages = [...previousMessages];
                for (let i = updatedMessages.length - 1; i >= 0; i--) {
                  if (updatedMessages[i].type === "ai") {
                    updatedMessages[i].message = "An error occurred while processing the response.";
                    updatedMessages[i].isSuccess = false;
                    break;
                  }
                }
                return updatedMessages;
              });
            }
          },
          onerror(error) {
            throw error
          },
        }
      )
    } catch {
      resetState()
      setMessages((previousMessages) => {
        let updatedMessages = [...previousMessages]
        for (let i = updatedMessages.length - 1; i >= 0; i--) {
          if (updatedMessages[i].type === "ai") {
            updatedMessages[i].message =
              "An error occured with your agent, please contact support."
            break
          }
        }
        return updatedMessages
      })
    }
  }

  React.useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    })
  }, [messages])

  if (!workflow) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex-shrink-0 border-b p-4">
        {/* Stock Chart */}
        {linkType && <StockChart props={linkType} />}
        {/* Function calls and timer */}
        <div className="flex items-center justify-end space-x-2">
          {functionCalls && functionCalls.length > 0 && (
            <Popover>
              <PopoverTrigger>
                <Badge variant="secondary" className="space-x-1">
                  <TbBolt className="text-lg text-green-400" />
                  <span className="font-mono">{functionCalls?.length}</span>
                </Badge>
              </PopoverTrigger>
              <PopoverContent side="bottom">
                <FunctionCalls functionCalls={functionCalls} />
              </PopoverContent>
            </Popover>
          )}
          <p className={`${timer === 0 ? "text-muted-foreground" : "text-primary"} font-mono text-sm`}>
            {timer.toFixed(1)}s
          </p>
        </div>
      </div>
      <div className="flex-grow overflow-auto">
        <div className="flex flex-col space-y-4 p-2">
          {messages.map(({ type, message, steps, isSuccess }, index) => (
            <Message
              key={index}
              type={type}
              message={message}
              steps={steps}
              profile={profile}
              isSuccess={isSuccess}
            />
          ))}
          <div ref={endOfMessagesRef} />
        </div>
      </div>
      <div className="sticky bottom-0 flex-shrink-0 border-t bg-background p-4">
        <div className="mx-auto max-w-4xl">
          <PromptForm
            onStop={() => abortStream()}
            onSubmit={async (value) => {
              onSubmit(value)
            }}
            onCreateSession={async (uuid) => {
              setSession(uuid)
              if (timerRef.current) {
                clearInterval(timerRef.current)
              }
              setMessages([])
              toast({
                description: "New session created",
              })
            }}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
