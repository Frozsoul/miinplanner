"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface CompletionChartProps {
    data: { date: string; completed: number }[];
}

const chartConfig = {
  completed: {
    label: "Tasks Completed",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function CompletionChart({ data }: CompletionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Completion History</CardTitle>
        <CardDescription>Tasks completed over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis allowDecimals={false} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="completed" fill="var(--color-completed)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
