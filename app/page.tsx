import React from 'react';
import { Card, Title, Text, Button, Grid } from "@tremor/react";
import Link from 'next/link';
import Image from 'next/image';
import ChatComponent from "@/components/ChatComponent";
// Removed unused import: TopicForm

export default function Page() {
  return (
    <div className="bg-gradient-to-b from-[#E6E6FF] to-white min-h-screen p-4 md:p-10 mx-auto max-w-7xl">
      {/* Header Section */}
      <div className="text-center mb-10">
        <Title className="text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#6601FF] to-[#8E2DE2]">
          Transform Client Advice with AI-Powered Scenario Insights
        </Title>
        <Text className="text-xl mb-6 text-gray-600">
          Leverage multi-agent AI to provide comprehensive scenario analysis and actionable advice for any client situation.
        </Text>
      </div>

      {/* How It Works Section */}
      <Grid className="gap-6 mb-10">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="mb-4">
            <Title className="text-2xl font-bold text-[#6601FF]">How It Works</Title>
          </div>
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex items-center">
              <div className="bg-[#6601FF] rounded-full p-2 mr-3">
                <span className="text-white font-bold">1</span>
              </div>
              <Text>Enter a client scenario (e.g., retirement planning, debt management).</Text>
            </div>

            {/* Step 2 */}
            <div className="flex items-start">
              <div className="bg-[#6601FF] rounded-full p-2 mr-3 mt-1">
                <span className="text-white font-bold">2</span>
              </div>
              <div>
                <Text className="font-semibold">Our AI agents will:</Text>
                <ul className="list-none space-y-2 mt-2">
                  <li className="flex items-center">
                    <span className="text-[#6601FF] mr-2">➤</span> Analyze the client’s financial situation
                  </li>
                  <li className="flex items-center">
                    <span className="text-[#6601FF] mr-2">➤</span> Generate multiple scenario options
                  </li>
                  <li className="flex items-center">
                    <span className="text-[#6601FF] mr-2">➤</span> Provide tailored recommendations based on the chosen scenario
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-center">
              <div className="bg-[#6601FF] rounded-full p-2 mr-3">
                <span className="text-white font-bold">3</span>
              </div>
              <Text>Receive a detailed action plan to guide your client through their financial decision-making process.</Text>
            </div>
          </div>

          {/* Powered by OnboardFi Section */}
          <div className="mt-6 border-t pt-4">
            <Link href="https://www.onboardfi.com/">
              <Image 
                src="/jul-logo-2.png" 
                alt="OnboardFi Logo" 
                width={150} 
                height={75} 
                objectFit="contain"
                className="cursor-pointer"
              />
            </Link>
        
          </div>
        </Card>
      </Grid>

      {/* Scenario Report Section */}
      <Card className="mb-10 shadow-lg w-full">
        <div className="p-6">
          <Title className="mb-4 text-2xl font-bold text-[#6601FF]">Scenario Report</Title>
          <ChatComponent />
        </div>
      </Card>
    </div>
  );
}
