import React, { useState, useEffect, useRef } from 'react';
import { getLoggedInUser } from '../utils/storage';

export default function Chatbot() {
    const [history, setHistory] = useState([]);    
    const [messages, setMessages] = useState([]);    
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const chatContainerRef = useRef(null);

    
    const userRaw = getLoggedInUser();
    const userEmail = typeof userRaw === 'string'
        ? encodeURIComponent(userRaw)
        : encodeURIComponent(userRaw.email);
    const userName = typeof userRaw === 'string'
        ? userRaw.split('@')[0]
        : (userRaw.name || userRaw.email.split('@')[0]);

    
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`http://localhost:5000/rides?user=${userEmail}`);
                setHistory(await res.json());
            } catch (err) {
                console.error('Could not load ride history', err);
            } finally {
                setHistoryLoaded(true);
            }
        })();
    }, [userEmail]);

    useEffect(() => {
        if (!historyLoaded || messages.length) return;
        setMessages([
            { role: 'assistant', content: `Hi ${userName}, how can I assist you today?` }
        ]);
    }, [historyLoaded, userName, messages.length]);

    useEffect(() => {
        chatContainerRef.current?.scrollTo(
            0,
            chatContainerRef.current.scrollHeight
        );
    }, [messages]);

    const callChatAPI = async (convo) => {
        const payload = convo
            .filter(m => typeof m.content === 'string')
            .map(m => ({ role: m.role, content: m.content }));
        const res = await fetch('http://localhost:5000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: payload })
        });
        return res.json();
    };

    const handleSelectRide = (idx) => {
        const r = history[idx];
        const details =
            `Here are the details for ride ${idx + 1}:\n` +
            `• From: ${r.from}\n` +
            `• To: ${r.to}\n` +
            `• When: ${new Date(r.timestamp).toLocaleString()}\n` +
            `• Status: ${r.status}\n` +
            `• Fare: $${r.fare}\n` +
            `• ETA: ${r.eta_minutes} minutes`;
        setMessages(m => [...m, { role: 'assistant', content: details }]);
    };

    const sendMessage = async () => {
        const text = input.trim();
        if (!text) return;
    
        const userMsg = { role: 'user', content: text };
        const updatedMessages = [...messages, userMsg];
        setInput('');
    
        // Always append user message to UI
        setMessages(updatedMessages);
    
        // Check for ride details request
        if (/ride details|my rides|ride history/i.test(text)) {
            const items = history.map((r, i) => ({
                idx: i,
                label: `${i + 1}. ${r.from} → ${r.to} on ${new Date(r.timestamp).toLocaleString()}`
            }));
            // Append assistant message to previously updated state (not to stale one)
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: { type: 'rideList', items } }
            ]);
            return;
        }
    
        setLoading(true);
        try {
            const botMsg = await callChatAPI(updatedMessages);
            setMessages(m => [...m, botMsg]);
        } catch (err) {
            console.error('Chat error', err);
            alert('Oops, something went wrong.');
        } finally {
            setLoading(false);
        }
    };
    
    if (!historyLoaded) {
        return (
            <div style={{ padding: '1rem', textAlign: 'center' }}>
                Loading your ride history…
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            fontFamily: 'sans-serif'
        }}>
            <h3 style={{ margin: '1%', textAlign: 'center' }}>Virtual Chatbot</h3>

           
            <div
                ref={chatContainerRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    border: '1px solid #ccc',
                    padding: '1rem',
                    background: '#fff'
                }}
            >
                {messages.map((m, i) => {
                    if (
                        m.role === 'assistant' &&
                        typeof m.content === 'object' &&
                        m.content.type === 'rideList'
                    ) {
                        return (
                            <div key={i} style={{ margin: '0.5rem 0' }}>
                                <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
                                    Here are your past rides:
                                </div>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {m.content.items.map(item => (
                                        <li key={item.idx} style={{ marginBottom: 4 }}>
                                            <button
                                                onClick={() => handleSelectRide(item.idx)}
                                                style={{
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    padding: '0.5rem',
                                                    border: '1px solid #007bff',
                                                    borderRadius: 4,
                                                    background: '#f0f8ff',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {item.label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    }

                    if (m.role !== 'system') {
                        const isUser = m.role === 'user';
                        return (
                            <div
                                key={i}
                                style={{
                                    textAlign: isUser ? 'right' : 'left',
                                    margin: '0.5rem 0'
                                }}
                            >
                                <span style={{
                                    display: 'inline-block',
                                    padding: '0.5rem 1rem',
                                    borderRadius: 12,
                                    background: isUser ? '#007bff' : '#e5e5ea',
                                    color: isUser ? '#fff' : '#000',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {m.content}
                                </span>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>

            <div
                style={{
                    display: 'flex',
                    padding: '0 1rem 1rem',
                    flex: '0 0 auto'
                }}
            >
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    disabled={loading}
                    placeholder="Ask me anything..."
                    style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: 4,
                        border: '1px solid #ccc'
                    }}
                />
                <button
                    onClick={sendMessage}
                    disabled={loading}
                    style={{
                        marginLeft: 8,
                        padding: '0.5rem 1rem',
                        border: 'none',
                        borderRadius: 4,
                        background: '#007bff',
                        color: '#fff',
                        cursor: 'pointer'
                    }}
                >
                    {loading ? '…' : 'Send'}
                </button>
            </div>
            </div>  
            );
}
