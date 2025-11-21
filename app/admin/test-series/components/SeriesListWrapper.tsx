"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function SeriesListWrapper({ children }: { children: ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            {children}
        </motion.div>
    );
}
