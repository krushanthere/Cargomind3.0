"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "../../i18n/routing";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  draftShipment?: any;
}

const SPEECH_LANG_MAP: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  or: "or-IN",
};

export default function RuralChatbot() {
  const locale = useLocale();
  const t = useTranslations("chatbot");
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<string>("greeting");
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [draftShipment, setDraftShipment] = useState<any>(null);
  const [hubs, setHubs] = useState<any[]>([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initialText = t("welcome");
      setMessages([
        {
          id: "msg-welcome",
          sender: "bot",
          text: initialText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      // Trigger initial assistant step
      sendMessage("start", "greeting", {});
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSubmitting]);

  // Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = SPEECH_LANG_MAP[locale] || "en-IN";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInput(transcript);
            handleUserMessage(transcript);
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [locale]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech Recognition is not supported on this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.lang = SPEECH_LANG_MAP[locale] || "en-IN";
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const switchLanguage = (newLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  const handleUserMessage = async (userText: string) => {
    if (!userText.trim() || isSubmitting) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSubmitting(true);

    await sendMessage(userText, step, draftShipment);
  };

  const sendMessage = async (userText: string, currentStep: string, currentDraft: any) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/chat/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          locale: locale,
          context: {
            step: currentStep,
            draft_shipment: currentDraft,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          draftShipment: data.draft_shipment,
        };

        setMessages((prev) => [...prev, botMsg]);
        setStep(data.step);
        setQuickReplies(data.quick_replies || []);
        if (data.draft_shipment) {
          setDraftShipment(data.draft_shipment);
        }
        if (data.hubs) {
          setHubs(data.hubs);
        }
      }
    } catch (err) {
      console.error("Chat API error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const placeOrder = async () => {
    if (!draftShipment) return;
    setIsPlacingOrder(true);

    try {
      const originId = draftShipment.origin_hub_id || (hubs[0] ? hubs[0].id : null);
      const destId = draftShipment.dest_hub_id || (hubs[1] ? hubs[1].id : hubs[0]?.id);

      if (!originId || !destId) {
        throw new Error("Missing Hub IDs");
      }

      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 24);

      const payload = {
        origin_hub_id: originId,
        dest_hub_id: destId,
        good_type: draftShipment.good_type || "farm_produce",
        urgency: draftShipment.urgency || "routine",
        producer_id: draftShipment.producer_id || "prod-rural-01",
        producer_name: draftShipment.producer_name || "Community Farmer",
        community_id: draftShipment.community_id || "comm-cluster-01",
        weight_kg: draftShipment.weight_kg || 100.0,
        volume_cbm: draftShipment.volume_cbm || 0.5,
        temp_class: draftShipment.temp_class || "chilled",
        sla_deadline: deadline.toISOString(),
        max_cost: 150.0,
      };

      const res = await fetch("http://127.0.0.1:8000/api/shipments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": "df6ed748-8ea2-42c9-9606-02f811dde457", // Shipper tenant default
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        const successMsg: ChatMessage = {
          id: `bot-success-${Date.now()}`,
          sender: "bot",
          text: `${t("orderSuccess")}${result.id.slice(0, 8).toUpperCase()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, successMsg]);
        setStep("completed");
        setQuickReplies([t("startOver")]);
      } else {
        alert("Failed to place shipment order. Please check connection.");
      }
    } catch (error) {
      console.error("Failed to place order:", error);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleQuickReply = (reply: string) => {
    if (reply === t("startOver") || reply.includes("पुनः") || reply.includes("ପୁନର୍ବାର")) {
      setMessages([]);
      setStep("greeting");
      setDraftShipment(null);
      sendMessage("start", "greeting", {});
      return;
    }

    if (reply.includes("Confirm") || reply.includes("कन्फर्म") || reply.includes("ନିଶ୍ଚିତ")) {
      placeOrder();
      return;
    }

    handleUserMessage(reply);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 cursor-pointer font-medium text-sm group"
          title={t("tooltip")}
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="font-semibold tracking-wide">
            {locale === "or" ? "ଗ୍ରାମୀଣ ସହାୟକ" : locale === "hi" ? "ग्रामीण सहायक" : "Rural Assistant"}
          </span>
        </button>
      )}

      {/* Chat Window Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-4rem)] bg-white rounded-2xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-emerald-950 text-white px-4 py-3.5 flex items-center justify-between border-b border-emerald-800/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300 text-sm font-bold">
                AI
              </div>
              <div>
                <h3 className="text-xs font-bold font-mono tracking-wider text-emerald-100 uppercase">
                  {t("title")}
                </h3>
                <p className="text-[10px] text-emerald-300/80 font-sans">
                  {t("subtitle")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Selector */}
              <div className="flex bg-emerald-900/80 rounded-lg p-0.5 border border-emerald-700/60">
                <button
                  onClick={() => switchLanguage("en")}
                  className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded cursor-pointer transition-colors ${
                    locale === "en" ? "bg-emerald-500 text-white" : "text-emerald-300 hover:text-white"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => switchLanguage("hi")}
                  className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded cursor-pointer transition-colors ${
                    locale === "hi" ? "bg-emerald-500 text-white" : "text-emerald-300 hover:text-white"
                  }`}
                >
                  हि
                </button>
                <button
                  onClick={() => switchLanguage("or")}
                  className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded cursor-pointer transition-colors ${
                    locale === "or" ? "bg-emerald-500 text-white" : "text-emerald-300 hover:text-white"
                  }`}
                >
                  ଓ
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-900/50 cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-neutral-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                    msg.sender === "user"
                      ? "bg-emerald-600 text-white rounded-br-none font-medium"
                      : "bg-white text-neutral-800 border border-neutral-200/80 rounded-bl-none font-sans"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-neutral-400 mt-1 font-mono px-1">
                  {msg.timestamp}
                </span>

                {/* Draft Shipment Card Preview */}
                {msg.sender === "bot" && step === "confirm" && draftShipment && (
                  <div className="mt-2.5 w-full max-w-[90%] bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs space-y-1.5 shadow-sm">
                    <div className="font-bold text-emerald-900 border-b border-emerald-200/60 pb-1 flex justify-between items-center">
                      <span>📦 {t("title")}</span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-mono">Draft</span>
                    </div>
                    <div className="text-[11px] text-emerald-950 space-y-1">
                      <p><span className="font-semibold">{t("origin")}:</span> {draftShipment.origin_hub_name || "Koraput Hub"}</p>
                      <p><span className="font-semibold">{t("destination")}:</span> {draftShipment.dest_hub_name || "Rayagada Hub"}</p>
                      <p><span className="font-semibold">{t("goodType")}:</span> {draftShipment.good_type_label || "Produce"}</p>
                      <p><span className="font-semibold">{t("tempClass")}:</span> {draftShipment.temp_label || "Chilled"}</p>
                      <p><span className="font-semibold">{t("weight")}:</span> {draftShipment.weight_kg} kg ({draftShipment.volume_cbm} m³)</p>
                    </div>

                    <button
                      onClick={placeOrder}
                      disabled={isPlacingOrder}
                      className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isPlacingOrder ? (
                        <span>Processing...</span>
                      ) : (
                        <>
                          <span>{t("confirmOrder")}</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isSubmitting && (
              <div className="flex items-center gap-1.5 text-neutral-400 text-xs py-2 px-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse delay-150" />
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse delay-300" />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Reply Chips */}
          {quickReplies.length > 0 && !isSubmitting && (
            <div className="px-3 py-2 bg-white border-t border-neutral-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickReply(reply)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 rounded-full whitespace-nowrap transition-colors cursor-pointer"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-neutral-200 flex items-center gap-2">
            {/* Speech to Text Mic */}
            <button
              onClick={toggleListening}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isListening
                  ? "bg-red-500 text-white border-red-600 animate-pulse"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border-neutral-200"
              }`}
              title={t("micTooltip")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUserMessage(input)}
              placeholder={isListening ? t("listening") : t("inputPlaceholder")}
              className="flex-1 bg-neutral-100 text-neutral-800 px-3.5 py-2 rounded-xl text-xs border border-neutral-200 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            />

            <button
              onClick={() => handleUserMessage(input)}
              disabled={!input.trim() || isSubmitting}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
