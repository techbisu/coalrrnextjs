import React from "react";
import { AuditGrid } from "./AuditGrid";
import { ActivityTimeline } from "./ActivityTimeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuditLogPayload } from "../types";

interface EntityHistoryProps {
  logs: (AuditLogPayload & { id: string, entry_ts: Date | string })[];
}

export function EntityHistory({ logs }: EntityHistoryProps) {
  return (
    <Tabs defaultValue="timeline" className="w-full">
      <TabsList className="mb-4 grid w-[200px] grid-cols-2">
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="grid">Grid</TabsTrigger>
      </TabsList>
      <TabsContent value="timeline" className="mt-0 border rounded-md p-4 bg-card text-card-foreground shadow-sm">
        <h3 className="font-semibold text-lg mb-2">History Timeline</h3>
        <ActivityTimeline logs={logs} />
      </TabsContent>
      <TabsContent value="grid" className="mt-0">
        <AuditGrid logs={logs} />
      </TabsContent>
    </Tabs>
  );
}
