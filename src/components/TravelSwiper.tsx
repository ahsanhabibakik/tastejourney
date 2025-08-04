"use client";

import dynamic from "next/dynamic";

export const Swiper = dynamic(() => import("swiper/react").then(m => m.Swiper), { ssr: false });
export const SwiperSlide = dynamic(() => import("swiper/react").then(m => m.SwiperSlide), { ssr: false });
