"use client";

import { useState, useEffect } from "react";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [currentState, setCurrentState] = useState("initial");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setMessages([
      {
        sender: "bot",
        text: "Bonjour, bienvenue sur LoyaltyHub ! Comment puis-je vous aider avec vos commandes, points, ou récompenses ?",
        buttons: [
          { text: "Suivi commande", intent: "commande" },
          { text: "Récompenses", intent: "récompenses" },
          { text: "Recommandation", intent: "recommandation" },
        ],
      },
    ]);
  }, []);

  const handleSend = async (e) => {
    const text = e.target ? e.target.value : e;
    if (!text || !text.trim()) {
      setMessages((prev) => [...prev, { sender: "bot", text: "Veuillez entrer une question valide." }]);
      return;
    }

    setLoading(true);
    setMessages((prev) => [...prev, { sender: "user", text }]);

    try {
      const res = await fetch("http://localhost:8000/chatbot", {  // Endpoint corrigé à /chatbot
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, state: currentState }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la requête API");
      }

      const data = await res.json();
      const { response, confidence, state, buttons } = data;

      setCurrentState(state);

      if (confidence < 0.4 && state === "initial") {
        setShowModal(true);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: response, buttons: buttons || [] },
        ]);
      }
    } catch (error) {
      console.error("Erreur API :", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Désolé, une erreur s’est produite." },
      ]);
    }

    setInput("");
    setLoading(false);
  };

  const handleModalConfirm = (confirm) => {
    let modalResponse = "";
    if (confirm) {
      modalResponse = "Merci, reformulez votre question !";
    } else {
      modalResponse = messages[messages.length - 1].text;
    }
    setMessages((prev) => [...prev, { sender: "bot", text: modalResponse }]);
    setShowModal(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition"
        >
          💬 Chat
        </button>
      ) : (
        <div className="bg-white w-96 h-[500px] rounded-xl shadow-2xl flex flex-col border border-gray-200">
          <div className="bg-blue-600 text-white p-3 rounded-t-xl flex justify-between items-center">
            <span className="font-semibold">Assistance LoyaltyHub</span>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">✖</button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 relative">
            {messages.map((msg, index) => (
              <div key={index} className={`mb-3 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                <span
                  className={`inline-block p-3 rounded-lg shadow-sm ${
                    msg.sender === "user" ? "bg-blue-100 text-blue-800" : "bg-white text-gray-800"
                  }`}
                >
                  {msg.text}
                </span>
                {msg.buttons && msg.buttons.length > 0 && (
                  <div className="mt-2">
                    {msg.buttons.map((btn, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(btn.text)}
                        className="bg-blue-500 text-white px-3 py-1 rounded-md mr-2 hover:bg-blue-600 transition"
                      >
                        {btn.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="text-center text-gray-500">Chargement...</div>}
            {showModal && (
              <div className="absolute inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
                <div className="bg-white p-4 rounded-lg shadow-lg">
                  <p className="mb-4">Je ne suis pas sûr de comprendre. Voulez-vous reformuler ?</p>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleModalConfirm(true)}
                      className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600"
                    >
                      Oui
                    </button>
                    <button
                      onClick={() => handleModalConfirm(false)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                    >
                      Non
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t bg-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(e)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Posez votre question sur LoyaltyHub..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;