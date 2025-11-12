// FILE: app/login/user/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Shield,
  Loader2,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Heart,
  ChevronLeft,
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
  const [canResend, setCanResend] = useState(false);

  // Timer for OTP expiry
  useEffect(() => {
    if (otpSent && expiresIn > 0) {
      const timer = setInterval(() => {
        setExpiresIn((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          if (prev <= 60) {
            setCanResend(true);
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
        setCanResend(false);

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
        setOtp("");
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
        setCanResend(false);
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

  const handleOTPInput = (value) => {
    const cleanValue = value.replace(/\D/g, "").slice(0, 6);
    setOtp(cleanValue);

    // Auto-submit when 6 digits entered
    if (cleanValue.length === 6 && expiresIn > 0) {
      // Small delay for better UX
      setTimeout(() => {
        handleVerifyOTP({ preventDefault: () => {} });
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Toaster position="top-right" />

      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="relative inline-block mb-6"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl rotate-6">
              <Heart className="w-12 h-12 text-white fill-white" />
            </div>
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
              className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="w-5 h-5 text-white" />
            </motion.div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-slate-900 mb-3"
          >
            HealWay
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-600 text-lg"
          >
            {step === 1 ? "Welcome! Please login to continue" : "Verify your identity"}
          </motion.p>
        </div>

        {/* Login Card */}
        <motion.div
          layout
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
        >
          {/* Progress Steps */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center justify-between relative">
              {/* Progress bar background */}
              <div className="absolute left-12 right-12 top-4 h-1 bg-blue-400/30 rounded-full"></div>
              
              {/* Active progress bar */}
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: step === 2 ? "100%" : "0%" }}
                transition={{ duration: 0.3 }}
                className="absolute left-12 right-12 top-4 h-1 bg-white rounded-full"
              ></motion.div>

              {/* Step 1 */}
              <div className="flex items-center gap-3 relative z-10">
                <motion.div
                  animate={{
                    scale: step >= 1 ? 1 : 0.8,
                    backgroundColor: step >= 1 ? "#ffffff" : "rgba(255,255,255,0.2)",
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg`}
                >
                  {step > 1 ? (
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  ) : (
                    <Phone className={`w-5 h-5 ${step >= 1 ? "text-blue-600" : "text-white"}`} />
                  )}
                </motion.div>
                <span className="text-white font-medium text-sm">Mobile</span>
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-3 relative z-10">
                <motion.div
                  animate={{
                    scale: step >= 2 ? 1 : 0.8,
                    backgroundColor: step >= 2 ? "#ffffff" : "rgba(255,255,255,0.2)",
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg"
                >
                  <Shield className={`w-5 h-5 ${step >= 2 ? "text-blue-600" : "text-white"}`} />
                </motion.div>
                <span className="text-white font-medium text-sm">Verify</span>
              </div>
            </div>
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {/* Step 1: Mobile Number */}
              {step === 1 && (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSendOTP}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-12 pr-4 py-4 text-slate-900 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="+91 9876543210"
                        required
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-3 flex items-center gap-2">
                      <Shield className="w-3 h-3" />
                      We'll send you a secure one-time password
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading || !mobileNumber}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  </motion.button>
                </motion.form>
              )}

              {/* Step 2: OTP Verification */}
              {step === 2 && (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleVerifyOTP}
                  className="space-y-6"
                >
                  {/* Testing OTP Display */}
                  {generatedOTP && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-5 h-5 text-amber-700" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-amber-900 mb-1">
                            ⚠️ Testing Mode
                          </p>
                          <p className="text-xs text-amber-800 mb-3">
                            OTP is displayed for testing (remove in production)
                          </p>
                          <motion.div 
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="bg-white rounded-xl px-6 py-4 border-2 border-amber-200 shadow-inner"
                          >
                            <p className="text-3xl font-bold text-center text-amber-900 tracking-[0.5em]">
                              {generatedOTP}
                            </p>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Enter 6-Digit OTP
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={otp}
                        onChange={(e) => handleOTPInput(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-5 text-slate-900 text-center text-3xl tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="●●●●●●"
                        maxLength={6}
                        autoComplete="one-time-code"
                        required
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-3 text-center">
                      Sent to <span className="font-semibold text-slate-700">{mobileNumber}</span>
                    </p>
                  </div>

                  {/* Timer */}
                  <div className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 rounded-xl">
                    {expiresIn > 0 ? (
                      <>
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-slate-600">
                          OTP expires in{" "}
                          <span className="font-bold text-blue-600 text-lg">
                            {formatTime(expiresIn)}
                          </span>
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="text-sm text-red-600 font-semibold">
                          OTP expired - Please resend
                        </span>
                      </>
                    )}
                  </div>

                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading || !otp || otp.length !== 6 || expiresIn === 0}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Verify & Login
                        </>
                      )}
                    </motion.button>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          setStep(1);
                          setOtpSent(false);
                          setOtp("");
                          setGeneratedOTP("");
                          setExpiresIn(300);
                        }}
                        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Change number
                      </button>
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={loading || !canResend}
                        className="text-sm text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer Links */}
        <div className="mt-8 text-center space-y-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to main login
          </Link>
          
          <div className="text-xs text-slate-500">
            <p>By logging in, you agree to our</p>
            <a href="#" className="text-blue-600 hover:text-blue-700 underline">
              Terms of Service
            </a>
            {" & "}
            <a href="#" className="text-blue-600 hover:text-blue-700 underline">
              Privacy Policy
            </a>
          </div>
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}