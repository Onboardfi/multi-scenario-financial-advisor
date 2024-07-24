/* eslint-disable react/jsx-key */
"use client"

import React, { useEffect } from "react"
import { motion } from "framer-motion"

import { AiOutlineExclamationCircle } from "react-icons/ai"
import { TbBolt } from "react-icons/tb"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import StockChart from "@/components/tradingview/stock-chart"

import { Profile } from "@/types/profile"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { CodeBlock } from "@/components/codeblock"
import { MemoizedReactMarkdown } from "@/components/markdown"

function PulsatingCursor() {
  return (
    <motion.div
      initial="start"
      animate={{
        scale: [1, 1, 1],
        opacity: [0, 1, 0],
      }}
      transition={{
        duration: 0.5,
        repeat: Infinity,
      }}
    >
      ▍
    </motion.div>
  )
}

interface MessageProps {
  type: string
  message: string
  isSuccess?: boolean
  steps?: Record<string, string>
  profile: Profile
  linkType?: string
  onResubmit?: () => void
}

export default function Message({
  type,
  message,
  isSuccess = true,
  steps,
  profile,
  linkType,
  onResubmit,
}: MessageProps) {
  const { toast } = useToast()
  const handleCopy = () => {
    navigator.clipboard.writeText(message)
    toast({
      description: "Message copied to clipboard!",
    })
  }

  useEffect(() => {
    if (linkType) {
      console.log("linkType in Message component:", linkType);
    }
  }, [linkType]);

  return (
    <div className="container flex flex-col space-y-1 pb-4 md:max-w-md lg:max-w-4xl">
      <div className="flex max-w-4xl space-x-4 pb-2 font-mono">
        <Avatar
          className={`h-8 w-8 rounded-md border ${
            type !== "human" && "text-green-400"
          }`}
        >
          <AvatarFallback className="rounded-md bg-background">
            {type === "human"
              ? "A"
              : "A"}
          </AvatarFallback>
        </Avatar>
        <div className="ml-4 mt-2 flex-1 flex-col space-y-2 overflow-hidden px-1">
          {message?.length === 0 && !steps && <PulsatingCursor />}
          {isSuccess ? (
            <>
              {steps
                ? Object.entries(steps).map(([key, value], index) => (
                    <Accordion defaultValue={key} type="single" collapsible key={index}>
                      <AccordionItem value={key} className="border-muted">
                        <AccordionTrigger
                          className={`mb-4 py-0 text-sm hover:no-underline ${
                            index > 0 && "mt-2"
                          }`}
                        >
                          <p className="font-semibold">{key}</p>
                        </AccordionTrigger>
                        <AccordionContent>
                          <CustomMarkdown message={value} />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ))
                : message && <CustomMarkdown message={message} />}
              {/* Conditionally render the StockChart based on linkType */}
              {linkType && <StockChart props={linkType} />}
            </>
          ) : (
            <MessageAlert error={message} />
          )}
        </div>
      </div>
    </div>
  )
}

interface CustomMarkdownProps {
  message: string
}

const CustomMarkdown = ({ message }: CustomMarkdownProps) => {
  return (
    <MemoizedReactMarkdown
      className="prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 break-words text-sm"
      remarkPlugins={[remarkGfm, remarkMath]}
      components={{
        table({ children }) {
          return (
            <div className="mb-2 rounded-md border">
              <Table>{children}</Table>
            </div>
          )
        },
        thead({ children }) {
          return <TableHeader>{children}</TableHeader>
        },
        tbody({ children }) {
          return <TableBody>{children}</TableBody>
        },
        tr({ children }) {
          return <TableRow>{children}</TableRow>
        },
        th({ children }) {
          return <TableHead className="py-2">{children}</TableHead>
        },
        td({ children }) {
          return <TableCell className="py-2">{children}</TableCell>
        },
        p({ children }) {
          return <p className="mb-5">{children}</p>
        },
        a({ children, href }) {
          return (
            <a
              href={href}
              className="text-primary underline"
              rel="noreferrer"
              target="_blank"
            >
              {children}
            </a>
          )
        },
        ol({ children }) {
          return <ol className="mb-5 list-decimal pl-[30px]">{children}</ol>
        },
        ul({ children }) {
          return <ul className="mb-5 list-disc pl-[30px]">{children}</ul>
        },
        li({ children }) {
          return <li className="pb-1">{children}</li>
        },
      }}
    >
      {message}
    </MemoizedReactMarkdown>
  )
}

interface MessageAlertProps {
  error: string
}

function MessageAlert({ error }: MessageAlertProps) {
  return (
    <Alert className="bg-destructive/10" variant="destructive">
      <AiOutlineExclamationCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        <b>{error}</b>
      </AlertDescription>
    </Alert>
  )
}
