import React from 'react';
import { Card, Title, Text } from "@tremor/react";
import ChatComponent from "@/components/ChatComponent";

export default function Page() {
  return (
    <div className="p-4 md:p-10 mx-auto max-w-7xl">
      <Title>Chat Interface</Title>
      <Text>Welcome to our AI-powered chat application.</Text>
      <Card className="mt-6">
        <ChatComponent />
      </Card>
    </div>
  );
}