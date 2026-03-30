"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface GlassCardProps {
	children: ReactNode;
	className?: string;
	animate?: boolean;
	delay?: number;
}

export function GlassCard({ children, className = "", animate = true, delay = 0 }: GlassCardProps) {
	const content = (
		<div
			className={`glass rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 ${className}`}
		>
			{children}
		</div>
	);

	if (!animate) return content;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay }}
		>
			{content}
		</motion.div>
	);
}
