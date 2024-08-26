import React from 'react';
import { Card, Title, Text, Button, Grid } from "@tremor/react";
import Link from 'next/link';
import Image from 'next/image';
import ChatComponent from "@/components/ChatComponent";
import TopicForm from "@/components/TopicForm";

export default function Page() {
  return (
    <div className="p-4 md:p-10 mx-auto max-w-7xl bg-gradient-to-b from-green-50 to-white min-h-screen">
      <div className="text-center mb-10">
        <Title className="text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-400">
          Unlock AI-Powered Stock Insights
        </Title>
        <Text className="text-xl mb-6 text-gray-600">
          Harness the power of multi-agent AI to gain comprehensive analysis on any stock ticker in minutes.
        </Text>
      </div>

      <Grid numItems={1} numItemsSm={2} className="gap-6 mb-10">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="mb-4">
            <Title className="text-2xl font-bold text-green-600">How It Works</Title>
          </div>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="bg-green-500 rounded-full p-2 mr-3">
                <span className="text-white font-bold">1</span>
              </div>
              <Text>Enter a stock ticker (e.g., AAPL for Apple).</Text>
            </div>
            <div className="flex items-start">
              <div className="bg-green-500 rounded-full p-2 mr-3 mt-1">
                <span className="text-white font-bold">2</span>
              </div>
              <div>
                <Text className="font-semibold">Our AI agents will:</Text>
                <ul className="list-none space-y-2 mt-2">
                  <li className="flex items-center">
                    <span className="text-emerald-500 mr-2">➤</span> Perform a high-level market overview
                  </li>
                  <li className="flex items-center">
                    <span className="text-emerald-500 mr-2">➤</span> Gather and analyze financial news
                  </li>
                  <li className="flex items-center">
                    <span className="text-emerald-500 mr-2">➤</span> Provide sentiment-driven insights
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-green-500 rounded-full p-2 mr-3">
                <span className="text-white font-bold">3</span>
              </div>
              <Text>Review your AI-generated stock report, tailored to your input.</Text>
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <Link href="https://www.onboardfi.com/" passHref>
              <Image 
                src="/jul-logo-2.png" 
                alt="OnboardFi Logo" 
                width={100} 
                height={50} 
                objectFit="contain"
                className="cursor-pointer"
              />
            </Link>
            <Text className="text-sm mt-2 italic text-gray-600">
              Brought to you by the{' '}
              <Link href="https://www.onboardfi.com/" className="text-green-500 hover:underline">
                OnboardFi
              </Link>{' '}
              team, leveraging the OnboardFi API for financial workflow automation.
            </Text>
          </div>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <Title className="mb-4 text-2xl font-bold text-green-600">Get Started</Title>
          <Text className="mb-4">Enter a stock ticker to see the workflow in action:</Text>
          <TopicForm />
        </Card>
      </Grid>
      <div className="text-center bg-gradient-to-r from-green-100 to-emerald-100 p-6 rounded-lg shadow-inner">
        <Text className="mb-4 text-lg text-gray-700">
          Like what you see? Save this ticker for ongoing monitoring.
        </Text>
        <Text className="mb-6 text-lg text-gray-700">
          Our system will run the workflow every 10 minutes, keeping you informed with the latest insights.
        </Text>
        <Link href="/cron-table" passHref>
          <Button size="lg" variant="primary" className="bg-green-500 hover:bg-green-600 transition-colors duration-300">
            View Saved Workflows
          </Button>
        </Link>
      </div>
      <Card className="mb-10 shadow-lg">
        <Title className="mb-4 text-2xl font-bold text-green-600">Sample Report</Title>
        <ChatComponent />
      </Card>
    </div>
  );
}