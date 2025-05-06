import React, { useState, useEffect } from "react";
import { getAllUsers, setUserEnabled } from "../utils/storage";
import Header from "./Header";

export default function UserManagement() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        setUsers(getAllUsers());
    }, []);

    const toggle = (email, current) => {
        setUserEnabled(email, !current);
        setUsers(getAllUsers());
    };

    return (
        <><Header />
            <div style={{ padding: 20, marginTop: 60 }}>
                <h2>User Management</h2>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: "left", padding: 8 }}>Email</th>
                            <th style={{ textAlign: "left", padding: 8 }}>Role</th>
                            <th style={{ textAlign: "left", padding: 8 }}>Status</th>
                            <th style={{ textAlign: "left", padding: 8 }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.filter(u => u.role !== "admin")
                            .map(u => (
                                <tr key={u.email} style={{ borderTop: "1px solid #eee" }}>
                                    <td style={{ padding: 8 }}>{u.email}</td>
                                    <td style={{ padding: 8 }}>{u.role}</td>
                                    <td style={{ padding: 8 }}>
                                        {u.enabled ? "Enabled" : "Disabled"}
                                    </td>
                                    <td style={{ padding: 8 }}>
                                        <button
                                            onClick={() => toggle(u.email, u.enabled)}
                                            style={{
                                                padding: "4px 8px",
                                                background: u.enabled ? "#e53e3e" : "#38a169",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: 4,
                                                cursor: "pointer"
                                            }}
                                        >
                                            {u.enabled ? "Disable" : "Enable"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
