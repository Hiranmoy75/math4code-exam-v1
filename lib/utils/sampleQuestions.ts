/**
 * Generate and download a sample questions template file
 * This creates a TSV (Tab-Separated Values) file that can be opened in Excel
 */
export function downloadSampleQuestionsFile() {
    const headers = [
        "Question Text",
        "Question Type",
        "Subject",
        "Topic",
        "Difficulty",
        "Marks",
        "Negative Marks",
        "Option A",
        "Option B",
        "Option C",
        "Option D",
        "Correct Answer",
        "Explanation",
    ];

    const sampleQuestions = [
        {
            questionText: "What is 2 + 2?",
            questionType: "MCQ",
            subject: "math",
            topic: "arithmetic",
            difficulty: "easy",
            marks: "1",
            negativeMarks: "0.25",
            optionA: "3",
            optionB: "4",
            optionC: "5",
            optionD: "6",
            correctAnswer: "B",
            explanation: "Basic addition: 2 + 2 = 4",
        },
        {
            questionText: "What is the capital of France?",
            questionType: "MCQ",
            subject: "cs",
            topic: "general knowledge",
            difficulty: "easy",
            marks: "1",
            negativeMarks: "0.25",
            optionA: "London",
            optionB: "Paris",
            optionC: "Berlin",
            optionD: "Madrid",
            correctAnswer: "B",
            explanation: "Paris is the capital city of France",
        },
        {
            questionText: "Solve: x² - 5x + 6 = 0",
            questionType: "MSQ",
            subject: "math",
            topic: "algebra",
            difficulty: "medium",
            marks: "2",
            negativeMarks: "0.5",
            optionA: "x=2",
            optionB: "x=3",
            optionC: "x=4",
            optionD: "x=1",
            correctAnswer: "A,B",
            explanation: "Factoring: (x-2)(x-3) = 0, so x = 2 or x = 3",
        },
        {
            questionText: "What is the value of π (to 2 decimal places)?",
            questionType: "NAT",
            subject: "math",
            topic: "geometry",
            difficulty: "easy",
            marks: "1",
            negativeMarks: "0",
            optionA: "",
            optionB: "",
            optionC: "",
            optionD: "",
            correctAnswer: "3.14",
            explanation: "π ≈ 3.14159..., rounded to 2 decimal places is 3.14",
        },
        {
            questionText: "Which of the following are prime numbers?",
            questionType: "MSQ",
            subject: "math",
            topic: "number theory",
            difficulty: "medium",
            marks: "2",
            negativeMarks: "0.5",
            optionA: "2",
            optionB: "4",
            optionC: "7",
            optionD: "9",
            correctAnswer: "A,C",
            explanation: "Prime numbers are divisible only by 1 and themselves. 2 and 7 are prime, while 4 and 9 are composite.",
        },
    ];

    // Create TSV content
    const rows = [
        headers.join("\t"),
        ...sampleQuestions.map((q) =>
            [
                q.questionText,
                q.questionType,
                q.subject,
                q.topic,
                q.difficulty,
                q.marks,
                q.negativeMarks,
                q.optionA,
                q.optionB,
                q.optionC,
                q.optionD,
                q.correctAnswer,
                q.explanation,
            ].join("\t")
        ),
    ];

    const tsvContent = rows.join("\n");

    // Create and download file
    const blob = new Blob([tsvContent], { type: "text/tab-separated-values;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sample_questions_template.docx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Instructions for using the template:
 * 
 * 1. Open the downloaded TSV file in Excel or Google Sheets
 * 2. Fill in your questions following the sample format
 * 3. Question Types: MCQ (Single Correct), MSQ (Multiple Correct), NAT (Numerical Answer Type)
 * 4. Subjects: math, cs, physics (or add your own)
 * 5. Difficulty: easy, medium, hard
 * 6. For MCQ: Correct Answer should be A, B, C, or D
 * 7. For MSQ: Correct Answer should be comma-separated like A,B or B,C,D
 * 8. For NAT: Leave options blank and put the numerical answer in Correct Answer
 * 9. Save as .xlsx or .xls format
 * 10. Upload using the Import button
 */
