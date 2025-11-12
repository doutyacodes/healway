// FILE: app/login/user/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Phone,
  Shield,
  Loader2,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

export default function UserLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Enter mobile, 2: Enter OTP
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState(""); // For testing
  const [expiresIn, setExpiresIn] = useState(300);

  // Timer for OTP expiry
  useState(() => {
    if (otpSent && expiresIn > 0) {
      const timer = setInterval(() => {
        setExpiresIn((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [otpSent, expiresIn]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber }),
      });

      const data = await res.json();

      if (data.success) {
        setOtpSent(true);
        setStep(2);
        setExpiresIn(data.expiresIn || 300);
        
        // ⚠️ TESTING ONLY - Display OTP on page
        setGeneratedOTP(data.otp);
        
        toast.success("OTP sent successfully!");
      } else {
        toast.error(data.error || "Failed to send OTP");
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber, otp }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Login successful!");
        setTimeout(() => {
          router.push(data.redirectTo || "/user/dashboard");
        }, 500);
      } else {
        toast.error(data.error || "Invalid OTP");
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtp("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber }),
      });

      const data = await res.json();

      if (data.success) {
        setExpiresIn(data.expiresIn || 300);
        setGeneratedOTP(data.otp);
        toast.success("OTP resent successfully!");
      } else {
        toast.error(data.error || "Failed to resend OTP");
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Toaster position="top-right" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl"
          >
            <User className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Patient Login
          </h1>
          <p className="text-slate-600">Enter your mobile number to continue</p>
        </div>

        {/* Login Card */}
        <motion.div
          layout
          className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
        >
          {/* Progress Steps */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 1
                      ? "bg-white text-blue-600"
                      : "bg-blue-700 text-white"
                  }`}
                >
                  {step > 1 ? <CheckCircle className="w-5 h-5" /> : "1"}
                </div>
                <span className="text-white font-medium">Mobile</span>
              </div>
              <div className="flex-1 h-1 bg-blue-700 mx-4"></div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 2
                      ? "bg-white text-blue-600"
                      : "bg-blue-700 text-white"
                  }`}
                >
                  {step >= 2 ? <Shield className="w-5 h-5" /> : "2"}
                </div>
                <span className="text-white font-medium">Verify</span>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Step 1: Mobile Number */}
            {step === 1 && (
              <motion.form
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSendOTP}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+91 1234567890"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    We'll send you a one-time password
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !mobileNumber}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send OTP
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {/* Step 2: OTP Verification */}
            {step === 2 && (
              <motion.form
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleVerifyOTP}
                className="space-y-6"
              >
                {/* Testing OTP Display */}
                {generatedOTP && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-900 mb-1">
                          ⚠️ Testing Mode
                        </p>
                        <p className="text-xs text-amber-700 mb-2">
                          Your OTP is displayed below (remove in production)
                        </p>
                        <div className="bg-white rounded-lg px-4 py-3 border border-amber-200">
                          <p className="text-2xl font-bold text-center text-amber-900 tracking-widest">
                            {generatedOTP}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Enter OTP
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-slate-900 text-center text-2xl tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="000000"
                      maxLength={6}
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    OTP sent to {mobileNumber}
                  </p>
                </div>

                {/* Timer */}
                <div className="flex items-center justify-center gap-2 text-sm">
                  {expiresIn > 0 ? (
                    <>
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-slate-600">
                        OTP expires in{" "}
                        <span className="font-semibold text-blue-600">
                          {formatTime(expiresIn)}
                        </span>
                      </span>
                    </>
                  ) : (
                    <span className="text-red-600 font-semibold">
                      OTP expired
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading || !otp || otp.length !== 6 || expiresIn === 0}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Verify OTP
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setOtpSent(false);
                        setOtp("");
                        setGeneratedOTP("");
                      }}
                      className="text-sm text-slate-600 hover:text-slate-900"
                    >
                      Change number
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={loading || expiresIn > 240}
                      className="text-sm text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Resend OTP
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </div>
        </motion.div>

        {/* Back to main login */}
        <div className="text-center mt-6">
          <Link
            href="/login"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← Back to main login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}