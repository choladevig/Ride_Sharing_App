import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import API from './Api';

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA336A"];

export default function PaymentPie() {
  const [data, setData] = useState([]);

  useEffect(() => {
    API.get("/payment_type")
      .then(res => {
        const chart = res.data.labels.map((label, i) => ({
          name: label,
          value: res.data.counts[i],
        }));
        setData(chart);
      })
      .catch(console.error);
  }, []);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={100} label>
          {data.map((_, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
