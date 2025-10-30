import { MathJax } from "better-react-mathjax";

export function renderWithLatex(text: string ) {
  return (
    <MathJax inline dynamic>
      {text}
    </MathJax>
  );
}