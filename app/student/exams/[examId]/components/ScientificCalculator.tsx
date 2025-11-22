"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { X, GripHorizontal } from "lucide-react"

interface ScientificCalculatorProps {
    onClose: () => void
}

export function ScientificCalculator({ onClose }: ScientificCalculatorProps) {
    const [display, setDisplay] = useState("0")
    const [memory, setMemory] = useState(0)
    const [isRadians, setIsRadians] = useState(true)
    const [waitingForOperand, setWaitingForOperand] = useState(false)
    const [pendingOperator, setPendingOperator] = useState<string | null>(null)
    const [value, setValue] = useState<number | null>(null)

    const inputDigit = (digit: string) => {
        if (waitingForOperand) {
            setDisplay(String(digit))
            setWaitingForOperand(false)
        } else {
            setDisplay(display === "0" ? String(digit) : display + digit)
        }
    }

    const inputDot = () => {
        if (waitingForOperand) {
            setDisplay("0.")
            setWaitingForOperand(false)
        } else if (display.indexOf(".") === -1) {
            setDisplay(display + ".")
        }
    }

    const clearDisplay = () => {
        setDisplay("0")
        setWaitingForOperand(false)
        setPendingOperator(null)
        setValue(null)
    }

    const toggleSign = () => {
        setDisplay(String(parseFloat(display) * -1))
    }

    const performOperation = (nextOperator: string) => {
        const inputValue = parseFloat(display)

        if (value === null) {
            setValue(inputValue)
        } else if (pendingOperator) {
            const currentValue = value || 0
            const newValue = calculate(currentValue, inputValue, pendingOperator)
            setValue(newValue)
            setDisplay(String(newValue))
        }

        setWaitingForOperand(true)
        setPendingOperator(nextOperator)
    }

    const calculate = (left: number, right: number, operator: string) => {
        switch (operator) {
            case "+": return left + right
            case "-": return left - right
            case "*": return left * right
            case "/": return left / right
            case "pow": return Math.pow(left, right)
            default: return right
        }
    }

    const handleFunction = (func: string) => {
        const current = parseFloat(display)
        let result = 0

        switch (func) {
            case "sin": result = isRadians ? Math.sin(current) : Math.sin(current * (Math.PI / 180)); break
            case "cos": result = isRadians ? Math.cos(current) : Math.cos(current * (Math.PI / 180)); break
            case "tan": result = isRadians ? Math.tan(current) : Math.tan(current * (Math.PI / 180)); break
            case "log": result = Math.log10(current); break
            case "ln": result = Math.log(current); break
            case "sqrt": result = Math.sqrt(current); break
            case "sq": result = current * current; break
            case "inv": result = 1 / current; break
            case "fact": result = factorial(current); break
            case "exp": result = Math.exp(current); break
            case "pi": result = Math.PI; break
            case "e": result = Math.E; break
        }

        setDisplay(String(result))
        setWaitingForOperand(true)
    }

    const factorial = (n: number): number => {
        if (n < 0) return NaN
        if (n === 0 || n === 1) return 1
        return n * factorial(n - 1)
    }

    return (
        <motion.div
            drag
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-20 left-20 z-50 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-[320px] overflow-hidden"
        >
            {/* Header */}
            <div className="bg-slate-900 p-2 flex items-center justify-between cursor-move handle">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium px-2">
                    <GripHorizontal className="w-4 h-4" />
                    Scientific Calculator
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Display */}
            <div className="p-4 bg-slate-800">
                <div className="bg-slate-900 rounded-lg p-3 text-right font-mono text-2xl text-emerald-400 overflow-hidden truncate shadow-inner border border-slate-700">
                    {display}
                </div>
                <div className="flex gap-2 mt-2 text-[10px] text-slate-500 font-mono">
                    <span className={isRadians ? "text-emerald-500 font-bold" : ""}>RAD</span>
                    <span>|</span>
                    <span className={!isRadians ? "text-emerald-500 font-bold" : ""}>DEG</span>
                </div>
            </div>

            {/* Keypad */}
            <div className="p-2 grid grid-cols-5 gap-1 bg-slate-800 pb-4">
                {/* Row 1 */}
                <Btn onClick={() => setIsRadians(!isRadians)} className="text-[10px]">{isRadians ? "DEG" : "RAD"}</Btn>
                <Btn onClick={() => handleFunction("pi")}>π</Btn>
                <Btn onClick={() => handleFunction("e")}>e</Btn>
                <Btn onClick={clearDisplay} className="bg-rose-600 hover:bg-rose-700 text-white col-span-2">C</Btn>

                {/* Row 2 */}
                <Btn onClick={() => handleFunction("sin")}>sin</Btn>
                <Btn onClick={() => handleFunction("cos")}>cos</Btn>
                <Btn onClick={() => handleFunction("tan")}>tan</Btn>
                <Btn onClick={() => setMemory(0)}>MC</Btn>
                <Btn onClick={() => setMemory(memory + parseFloat(display))}>M+</Btn>

                {/* Row 3 */}
                <Btn onClick={() => handleFunction("sq")}>x²</Btn>
                <Btn onClick={() => handleFunction("sqrt")}>√</Btn>
                <Btn onClick={() => handleFunction("inv")}>1/x</Btn>
                <Btn onClick={() => handleFunction("log")}>log</Btn>
                <Btn onClick={() => handleFunction("ln")}>ln</Btn>

                {/* Row 4 */}
                <Btn onClick={() => inputDigit("7")} className="bg-slate-700 text-white hover:bg-slate-600">7</Btn>
                <Btn onClick={() => inputDigit("8")} className="bg-slate-700 text-white hover:bg-slate-600">8</Btn>
                <Btn onClick={() => inputDigit("9")} className="bg-slate-700 text-white hover:bg-slate-600">9</Btn>
                <Btn onClick={() => performOperation("/")} className="bg-indigo-600 hover:bg-indigo-700 text-white">÷</Btn>
                <Btn onClick={() => performOperation("pow")} className="bg-indigo-600 hover:bg-indigo-700 text-white">^</Btn>

                {/* Row 5 */}
                <Btn onClick={() => inputDigit("4")} className="bg-slate-700 text-white hover:bg-slate-600">4</Btn>
                <Btn onClick={() => inputDigit("5")} className="bg-slate-700 text-white hover:bg-slate-600">5</Btn>
                <Btn onClick={() => inputDigit("6")} className="bg-slate-700 text-white hover:bg-slate-600">6</Btn>
                <Btn onClick={() => performOperation("*")} className="bg-indigo-600 hover:bg-indigo-700 text-white">×</Btn>
                <Btn onClick={() => handleFunction("fact")} className="bg-indigo-600 hover:bg-indigo-700 text-white">n!</Btn>

                {/* Row 6 */}
                <Btn onClick={() => inputDigit("1")} className="bg-slate-700 text-white hover:bg-slate-600">1</Btn>
                <Btn onClick={() => inputDigit("2")} className="bg-slate-700 text-white hover:bg-slate-600">2</Btn>
                <Btn onClick={() => inputDigit("3")} className="bg-slate-700 text-white hover:bg-slate-600">3</Btn>
                <Btn onClick={() => performOperation("-")} className="bg-indigo-600 hover:bg-indigo-700 text-white">-</Btn>
                <Btn onClick={() => performOperation("+")} className="bg-indigo-600 hover:bg-indigo-700 text-white" style={{ gridRow: "span 2" }}>+</Btn>

                {/* Row 7 */}
                <Btn onClick={() => inputDigit("0")} className="bg-slate-700 text-white hover:bg-slate-600 col-span-2">0</Btn>
                <Btn onClick={inputDot} className="bg-slate-700 text-white hover:bg-slate-600">.</Btn>
                <Btn onClick={toggleSign} className="bg-slate-700 text-white hover:bg-slate-600">±</Btn>
                <Btn onClick={() => performOperation("=")} className="bg-emerald-600 hover:bg-emerald-700 text-white">=</Btn>
            </div>
        </motion.div>
    )
}

function Btn({ children, onClick, className = "", style = {} }: any) {
    return (
        <button
            onClick={onClick}
            style={style}
            className={`h-10 rounded text-xs font-medium transition-colors active:scale-95 flex items-center justify-center ${className || "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"}`}
        >
            {children}
        </button>
    )
}
