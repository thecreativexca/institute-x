"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { siteConfig } from "@/lib/config/site";
import { formatCurrency } from "@/lib/payments/razorpay";

interface CheckoutCourse {
  _id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  level: string;
  durationWeeks?: number;
  thumbnailUrl?: string;
  price?: number;
  compareAtPrice?: number;
  currency: string;
  isFree?: boolean;
  isPurchasable?: boolean;
  categorySlug?: string;
}

interface CheckoutClientProps {
  course: CheckoutCourse;
  student: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export function CheckoutClient({ course, student }: CheckoutClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<{
    paymentId: string;
    razorpayOrderId: string;
    amount: number;
    currency: string;
    keyId: string;
  } | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponQuote, setCouponQuote] = useState<{
    code: string;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
  } | null>(null);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => setError("Unable to load payment gateway. Please try again.");
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handlePayment = useCallback(async () => {
    if (!razorpayLoaded) return;

    setLoading(true);
    setError(null);

    let activeOrder = orderData;
    if (!activeOrder) {
      try {
        const orderResponse = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId: course._id, couponCode: couponQuote?.code }),
        });
        const orderResult = await orderResponse.json();
        if (!orderResponse.ok || !orderResult.success) {
          throw new Error(orderResult.error || "Failed to prepare payment");
        }
        activeOrder = orderResult.data;
        setOrderData(activeOrder);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to prepare payment");
        setLoading(false);
        return;
      }
    }

    if (!activeOrder) {
      setError("Failed to prepare payment");
      setLoading(false);
      return;
    }
    const paymentOrder = activeOrder;

    const options = {
      key: paymentOrder.keyId,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      name: siteConfig.name,
      description: course.name,
      order_id: paymentOrder.razorpayOrderId,
      prefill: {
        name: student.name,
        email: student.email,
        contact: student.phone || "",
      },
      theme: {
        color: "#2563eb",
      },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        try {
          const verifyResponse = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentId: paymentOrder.paymentId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyResponse.json();
          if (!verifyData.success) {
            throw new Error(verifyData.error || "Payment verification failed");
          }
          router.push(`/payment/success?paymentId=${paymentOrder.paymentId}`);
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Payment verification failed");
          setLoading(false);
        }
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
          setError("Payment cancelled. You can try again.");
        },
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  }, [orderData, razorpayLoaded, course._id, course.name, student, router, couponQuote]);

  async function applyCoupon() {
    const code = couponCode.trim();
    if (!code) { setCouponQuote(null); setOrderData(null); setError("Enter a coupon code."); return; }
    setCouponLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, courseId: course._id }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Coupon could not be applied.");
      setCouponQuote(result.quote);
      setCouponCode(result.quote.code);
      setOrderData(null);
    } catch (couponError) {
      setCouponQuote(null);
      setOrderData(null);
      setError(couponError instanceof Error ? couponError.message : "Coupon could not be applied.");
    } finally {
      setCouponLoading(false);
    }
  }

  const price = course.price ?? 0;
  const comparePrice = course.compareAtPrice;
  const hasDiscount = comparePrice && comparePrice > price;

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12 lg:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm" aria-label="Breadcrumb">
          <Link href="/" className="text-slate-500 hover:text-slate-700">Home</Link>
          <span className="text-slate-400" aria-hidden="true">/</span>
          <Link href="/courses" className="text-slate-500 hover:text-slate-700">Courses</Link>
          <span className="text-slate-400" aria-hidden="true">/</span>
          <Link href={`/courses/${course.slug}`} className="text-slate-500 hover:text-slate-700">
            {course.name}
          </Link>
          <span className="text-slate-400" aria-hidden="true">/</span>
          <span className="text-slate-900 font-medium" aria-current="page">Checkout</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course & Student Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Details */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Course Details</h2>
              <div className="flex gap-4">
                {course.thumbnailUrl && (
                  <Image
                    src={course.thumbnailUrl}
                    alt=""
                    width={192}
                    height={128}
                    className="h-32 w-48 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{course.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{course.categorySlug}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {course.durationWeeks} weeks
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Student Info */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Student Information</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-slate-500">Name</dt>
                  <dd className="font-medium text-slate-900">{student.name}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Email</dt>
                  <dd className="font-medium text-slate-900">{student.email}</dd>
                </div>
                {student.phone && (
                  <div>
                    <dt className="text-slate-500">Phone</dt>
                    <dd className="font-medium text-slate-900">{student.phone}</dd>
                  </div>
                )}
              </dl>
            </Card>

            {/* Terms & Conditions */}
            <Card className="p-6 border-amber-200 bg-amber-50">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="font-medium text-amber-900">Terms & Conditions</h3>
                  <p className="text-sm text-amber-800 mt-1">
                    By proceeding with payment, you agree to our{" "}
                    <Link href="/terms" className="underline hover:text-amber-700">Terms & Conditions</Link>{" "}
                    and{" "}
                    <Link href="/refund-policy" className="underline hover:text-amber-700">Refund Policy</Link>.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Order Summary - Sticky */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{course.name}</span>
                  <span className="font-medium text-slate-900">{formatCurrency(price, course.currency)}</span>
                </div>
                {hasDiscount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Original Price</span>
                    <span className="text-slate-500 line-through">{formatCurrency(comparePrice!, course.currency)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-3">
                  <label htmlFor="coupon-code" className="text-sm font-medium text-slate-700">Coupon code</label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      id="coupon-code"
                      value={couponCode}
                      onChange={(event) => {
                        setCouponCode(event.target.value.toUpperCase().replace(/\s/g, ""));
                        if (couponQuote) { setCouponQuote(null); setOrderData(null); }
                      }}
                      onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void applyCoupon(); } }}
                      placeholder="Enter code"
                      className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm uppercase outline-none focus:ring-2 focus:ring-primary-600/30"
                      maxLength={40}
                    />
                    <Button type="button" variant="outline" isLoading={couponLoading} onClick={applyCoupon}>Apply</Button>
                  </div>
                  {couponQuote ? <p className="mt-2 text-xs font-medium text-amber-800">{couponQuote.code} applied successfully.</p> : null}
                </div>
                {couponQuote ? (
                  <div className="flex justify-between text-sm text-amber-800">
                    <span>Coupon discount</span>
                    <span className="font-medium">−{formatCurrency(couponQuote.discountAmount, course.currency)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm border-t border-slate-200 pt-3">
                  <span className="font-medium text-slate-900">Total</span>
                  <span className="font-semibold text-slate-900 text-lg">{formatCurrency(couponQuote?.finalAmount ?? price, course.currency)}</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
                  {error}
                </div>
              )}

              <Button
                onClick={handlePayment}
                disabled={loading || !razorpayLoaded}
                className="w-full"
                size="lg"
              >
                {loading ? "Preparing Payment..." : `Pay ${formatCurrency(couponQuote?.finalAmount ?? price, course.currency)}`}
              </Button>

              <p className="mt-4 text-center text-xs text-slate-500">
                Secure payment powered by Razorpay
              </p>

              <Link
                href={`/courses/${course.slug}`}
                className="block mt-4 text-center text-sm text-primary-600 hover:underline"
              >
                Back to Course
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
