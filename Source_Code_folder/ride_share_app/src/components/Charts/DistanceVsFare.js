import React, { useState, useEffect } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import API from './Api';

export default function DistanceVsFare() {
  const [data, setData] = useState([]);

  useEffect(() => {
    API.get("/distance_vs_fare")
      .then(res => setData(res.data))
      .catch(console.error);
  }, []);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart>
        <CartesianGrid />
        <XAxis dataKey="trip_miles" name="Miles" unit="mi" />
        <YAxis dataKey="fare" name="Fare" unit="$" />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
        <Scatter data={data} fill="#ff6666" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
