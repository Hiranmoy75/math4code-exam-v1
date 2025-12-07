import { Header } from "@/components/landing/Header";
import AIMentor from "@/components/landing/AIMentor";
import { Footer } from "@/components/landing/Footer";


export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-white font-sans antialiased">
            <Header />
            <main>
                {children}
                <AIMentor />
                <Footer />
            </main>
        </div>
    );
}
