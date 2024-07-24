"use client"
import React, { useState, useEffect, useRef } from "react"
import { Workflow } from "@/models/models"
import { fetchEventSource } from "@microsoft/fetch-event-source"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { v4 as uuidv4 } from "uuid"
import { Profile } from "@/types/profile"
import { useToast } from "@/components/ui/use-toast"
import Message from "@/components/message"
import PromptForm from "./prompt-form"
import { TickerTape } from '@/components/tradingview/ticker-tape'

dayjs.extend(relativeTime)
const defaultFunctionCalls = [{ type: "start" }]

const safeParseJSON = (data: string) => {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error("Error parsing JSON:", error, "Data:", data);
    return null;
  }
}

export default function Chat({ profile, llms }: { profile: Profile; llms: any }) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [messages, setMessages] = useState<{
    type: string
    message: string
    steps?: Record<string, { content: string; linkType?: string }>
    isSuccess?: boolean
  }[]>([])
  const [functionCalls, setFunctionCalls] = useState<any[]>()
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null)
  const [timer, setTimer] = useState<number>(0)
  const [session, setSession] = useState<string | null>(uuidv4())
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()
  const abortControllerRef = useRef<AbortController | null>(null)

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
          setMessages([{ 
            type: "ai", 
            message: data.data.steps[0].agent.initialMessage, 
            steps: { 
              "initialMessage": { 
                content: data.data.steps[0].agent.initialMessage, 
                linkType: undefined 
              } 
            } 
          }]);
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

  const handleToggleLink = (data: { function: string; args: string }) => {
    console.log('Received function call data:', data);
    const parsedArgs = safeParseJSON(data.args);
    if (parsedArgs) {
      const newLinkType = parsedArgs.toggle.toUpperCase();
      if (newLinkType) {
        console.log(`Toggling to stock: ${newLinkType}`);
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.type === "ai" && lastMessage.steps) {
            const stepKeys = Object.keys(lastMessage.steps);
            if (stepKeys.length > 0) {
              const firstStepKey = stepKeys[0];
              lastMessage.steps[firstStepKey] = {
                ...lastMessage.steps[firstStepKey],
                linkType: newLinkType
              };
              // Clear linkType from other steps
              stepKeys.slice(1).forEach(key => {
                lastMessage.steps[key] = {
                  ...lastMessage.steps[key],
                  linkType: undefined
                };
              });
            }
          }
          return newMessages;
        });
      } else {
        console.error('No stock symbol specified in the function call data');
      }
    }
  };
  
  async function onSubmit(value?: string) {
    let messageByEventIds: Record<string, { content: string; linkType?: string }> = {}
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

    setMessages((previousMessages) => [
      ...previousMessages,
      { type: "human", message: value || "" },
      { type: "ai", message: "" }
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
          onopen() {
            setFunctionCalls(defaultFunctionCalls)
          },
          onclose() {
            setFunctionCalls((prev = []) => [...prev, { type: "end" }])
            resetState()
            console.log("Message sent.");
          },
          onmessage(event) {
            console.log("Raw event:", event);
            if (event.id) currentEventId = event.id;
            try {
              if (event.event === "function_call") {
                console.log("Raw event data:", event.data);
                let data = event.data.replace(/'/g, '"').replace(/"args": "({.*?})"/, (match, p1) => `"args": "${p1.replace(/"/g, '\\"')}"`);
                const parsedData = safeParseJSON(data);
                console.log("Parsed function call data:", parsedData);
                if (parsedData?.function === "dotoggle") {
                  handleToggleLink(parsedData);
                }
              } else if (event.event === "error") {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastAiMessage = updated.findLast(m => m.type === "ai");
                  if (lastAiMessage) {
                    lastAiMessage.message = event.data;
                    lastAiMessage.isSuccess = false;
                  }
                  return updated;
                });
              } else if (event.data !== "[END]" && currentEventId) {
                if (!messageByEventIds[currentEventId]) {
                  messageByEventIds[currentEventId] = { content: "" };
                }
                messageByEventIds[currentEventId].content += event.data === "" ? "\n" : event.data;
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastAiMessage = updated.findLast(m => m.type === "ai");
                  if (lastAiMessage) {
                    lastAiMessage.steps = { ...messageByEventIds };
                  }
                  return updated;
                });
              }
            } catch (error) {
              console.error("Error processing event:", error);
              console.log("Problematic event data:", event.data);
              setMessages((prev) => {
                const updated = [...prev];
                const lastAiMessage = updated.findLast(m => m.type === "ai");
                if (lastAiMessage) {
                  lastAiMessage.message = "An error occurred while processing the response.";
                  lastAiMessage.isSuccess = false;
                }
                return updated;
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
      setMessages((prev) => {
        const updated = [...prev];
        const lastAiMessage = updated.findLast(m => m.type === "ai");
        if (lastAiMessage) {
          lastAiMessage.message = "An error occurred with your agent, please contact support.";
          lastAiMessage.isSuccess = false;
        }
        return updated;
      });
    }
  }

  useEffect(() => {
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
      <TickerTape />
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
            onStop={abortStream}
            onSubmit={onSubmit}
            onCreateSession={(uuid) => {
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