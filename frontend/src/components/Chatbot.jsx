import React, { useState, useEffect, useRef } from "react";

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [hasGreeted, setHasGreeted] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && !hasGreeted) {
            setHasGreeted(true);
            const greeting = {
                id: Date.now(),
                text: "👋 Hi! I'm your CampusKart assistant. Ask me about selling, buying, wishlists, trust scores, or the leaderboard!",
                sender: "bot",
                timestamp: new Date()
            };
            setMessages([greeting]);
        }
    }, [isOpen, hasGreeted]);

    const getBotResponse = (userMessage) => {
        const message = userMessage.toLowerCase();

        // TRUST SCORE - Enhanced with detailed points
        if (message.includes("trust") || message.includes("score") || message.includes("point") || message.includes("reputation")) {
            return "⭐ Trust Score System:\n\nTrust score is earned through actions on CampusKart:\n\n📝 Account Actions:\n• Signup: +10 points\n• Login: +1 point\n\n📦 Selling:\n• Create listing: +5 points\n• Complete sale (seller): +15 points\n\n🛍️ Buying:\n• Complete purchase (buyer): +20 points\n\n⭐ Ratings:\n• Give a rating: +2 points\n• Receive a rating: +3 points\n• Receive 5-star rating: +5 points (3 + 2 bonus)\n\n🏆 Impact:\nYour trust score determines your leaderboard ranking and helps unlock badges. Higher trust = Better reputation!";
        }

        // BADGES - Enhanced with unlock requirements
        if (message.includes("badge") || message.includes("achievement") || message.includes("reward")) {
            return "🎖️ Achievement Badges:\n\nEarn badges to showcase your accomplishments:\n\n🥉 First Trade Badge\n→ Complete your first transaction\n→ Shows you're an active trader\n\n🌟 Trusted User Badge\n→ Reach 100 trust points\n→ Demonstrates reliability\n\n💎 Power Seller Badge\n→ Complete 5 successful sales\n→ Proves you're a top seller\n\n📍 Display:\nYour badges appear on:\n• Your profile page\n• Navbar (badge count)\n• Product listings\n\nStart trading to unlock them all!";
        }

        // LEADERBOARD - Enhanced explanation
        if (message.includes("leaderboard") || message.includes("ranking") || message.includes("rank")) {
            return "🏆 Leaderboard Rankings:\n\nThe leaderboard shows top users ranked by total trust points.\n\n📊 What's Displayed:\n• User rank (#1, #2, #3...)\n• User name\n• Total trust points\n• Number of badges earned\n\n🎯 How to Climb:\n1. Complete more transactions\n2. Earn positive ratings\n3. Maintain active trading\n4. Unlock achievement badges\n\n💡 Tip: Consistent trading is key to reaching the top!\n\nView the leaderboard on the Home page.";
        }

        // WISHLIST - Enhanced explanation
        if (message.includes("wishlist") || message.includes("favorite") || message.includes("save")) {
            return "❤️ Wishlist Feature:\n\nSave items you're interested in for later:\n\n📌 How to Use:\n1. Browse products on the Home page\n2. Click the heart ❤️ icon on any product\n3. Item is added to your wishlist\n4. Access via 'Wishlist' in the navbar\n\n✨ Features:\n• View all saved items in one place\n• Remove items anytime\n• Quick access to product details\n• Saved during your session\n\n💡 Pro Tip: Add items to wishlist while browsing, then review later when ready to buy!";
        }

        // SELLING - Enhanced with detailed steps
        if (message.includes("sell") || message.includes("list")) {
            return "📦 Selling on CampusKart:\n\nCreate listings to sell your items:\n\n🔸 Step-by-Step:\n1. Click 'Sell' button on Home page\n2. Fill in product details:\n   • Product name\n   • Category\n   • Price (₹)\n   • Description\n   • Bought year\n   • Preferred buyer year\n3. Add an image URL\n4. Submit your listing\n\n📊 Manage Listings:\n• View in Dashboard → 'My Listings'\n• Edit or delete anytime\n• Track sold items\n\n💰 Earnings:\n• Listing: +5 trust points\n• Successful sale: +15 trust points\n\nStart selling to earn trust and climb the leaderboard!";
        }

        // BUYING - Enhanced with detailed steps
        if (message.includes("buy") || message.includes("purchase")) {
            return "🛍️ Buying on CampusKart:\n\nFind and purchase items from other students:\n\n🔸 Browse & Search:\n1. View all products on Home page\n2. Use search bar to find items\n3. Filter by category or year\n4. Check seller's trust score & badges\n\n🔸 Purchase Process:\n1. Click on a product to view details\n2. Review:\n   • Price and condition\n   • Seller information\n   • Ratings and reviews\n3. Reserve the item\n4. Arrange meetup with seller\n5. Complete transaction\n6. Rate the seller\n\n💰 Rewards:\n• Complete purchase: +20 trust points\n• Give rating: +2 trust points\n\nCheck your Cart to see reserved items!";
        }

        // DASHBOARD - Enhanced explanation
        if (message.includes("dashboard")) {
            return "📊 Seller Dashboard:\n\nYour central hub for managing sales:\n\n📦 My Listings:\n• View all your active listings\n• Edit product details\n• Delete listings\n• See status (available/sold)\n\n💼 Sold Items:\n• Track completed sales\n• View transaction history\n• Monitor your performance\n\n📈 Quick Stats:\n• Total listings\n• Items sold\n• Revenue earned\n\n🎯 Access: Click 'Dashboard' in the navbar\n\nManage your entire selling business in one place!";
        }

        // GREETINGS
        if (message.includes("hello") || message.includes("hi") || message.includes("hey")) {
            return "Hello! 👋 How can I help you with CampusKart today?\n\nI can explain:\n• Trust scores & points\n• Badges & achievements\n• Leaderboard rankings\n• Wishlist feature\n• How to sell items\n• How to buy products\n• Dashboard features";
        }

        // THANKS
        if (message.includes("thank")) {
            return "You're welcome! 😊 Feel free to ask if you need anything else.\n\nHappy trading on CampusKart!";
        }

        // Default response
        return "🤔 I can help you with:\n\n⭐ Trust Score & Points\n🎖️ Badges & Achievements\n🏆 Leaderboard Rankings\n❤️ Wishlist Feature\n📦 Selling Items\n🛍️ Buying Products\n📊 Dashboard Features\n\nJust ask me about any topic!";
    };

    const handleSend = () => {
        if (!inputValue.trim()) return;

        const userMessage = {
            id: Date.now(),
            text: inputValue,
            sender: "user",
            timestamp: new Date()
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");

        // Simulate bot typing delay
        setTimeout(() => {
            const botResponse = {
                id: Date.now() + 1,
                text: getBotResponse(inputValue),
                sender: "bot",
                timestamp: new Date()
            };
            setMessages((prev) => [...prev, botResponse]);
        }, 500);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            {/* Floating Chat Button */}
            <button
                className="chatbot-button"
                onClick={toggleChat}
                aria-label={isOpen ? "Close chat" : "Open chat"}
                title="Chat with us"
            >
                {isOpen ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                )}
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="chatbot-panel">
                    <div className="chatbot-header">
                        <div>
                            <h3>CampusKart Assistant</h3>
                            <p className="chatbot-status">Online</p>
                        </div>
                        <button
                            className="chatbot-close"
                            onClick={toggleChat}
                            aria-label="Close chat"
                        >
                            ×
                        </button>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`chat-bubble ${message.sender === "user" ? "chat-bubble-user" : "chat-bubble-bot"
                                    }`}
                            >
                                <div className="chat-bubble-content">
                                    {message.text.split('\n').map((line, i) => (
                                        <React.Fragment key={i}>
                                            {line}
                                            {i < message.text.split('\n').length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                </div>
                                <div className="chat-bubble-time">
                                    {message.timestamp.toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    })}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chatbot-input-container">
                        <input
                            type="text"
                            className="chatbot-input"
                            placeholder="Type your message..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                        <button
                            className="chatbot-send"
                            onClick={handleSend}
                            disabled={!inputValue.trim()}
                            aria-label="Send message"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
