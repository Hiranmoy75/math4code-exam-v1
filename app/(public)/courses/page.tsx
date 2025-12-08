import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, User, Clock, Star, ChevronRight, Filter } from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { CourseThumbnail } from "@/components/ui/CourseThumbnail";

export default async function MarketplacePage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; category?: string }>;
}) {
    const { q, category } = await searchParams;
    const supabase = await createClient();

    let query = supabase
        .from("courses")
        .select("*, profiles:creator_id(full_name)")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .range(0, 19);

    if (q) {
        query = query.ilike("title", `%${q}%`);
    }

    if (category) {
        query = query.eq("category", category);
    }

    const { data: courses } = await query;

    const categories = [
        "Development",
        "Business",
        "Design",
        "Marketing",
        "Academic",
        "Mathematics",
        "Data Science"
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            <Header />

            {/* Hero Section */}
            <div className="pt-28 pb-12 bg-[#0f172a] text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10"></div>

                <div className="container max-w-[1200px] mx-auto px-4 md:px-6 relative z-10">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
                            Explore Our Courses
                        </h1>
                        <p className="text-lg text-slate-400 mb-8">
                            Master mathematics and coding with our expertly crafted courses. From basics to advanced concepts, find the perfect path for your learning journey.
                        </p>

                        {/* Search Bar in Hero */}
                        <div className="relative max-w-xl">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-500" />
                            </div>
                            <form>
                                <input
                                    type="search"
                                    name="q"
                                    defaultValue={q}
                                    placeholder="Search for courses, topics, or instructors..."
                                    className="w-full pl-11 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-lg backdrop-blur-sm"
                                />
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <main className="container max-w-[1200px] mx-auto px-4 md:px-6 py-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters - Desktop */}
                    <div className="hidden lg:block w-64 shrink-0 space-y-8">
                        <div>
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Filter className="w-4 h-4" /> Filters
                            </h3>
                            <div className="space-y-2">
                                <Link href="/courses" className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!category ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`}>
                                    All Categories
                                </Link>
                                {categories.map((cat) => (
                                    <Link
                                        key={cat}
                                        href={`/courses?category=${cat.toLowerCase()}`}
                                        className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${category === cat.toLowerCase() ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`}
                                    >
                                        {cat}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Filters */}
                    <div className="lg:hidden overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                        <div className="flex gap-2">
                            <Link href="/courses">
                                <Badge variant={!category ? "default" : "outline"} className="whitespace-nowrap py-2 px-4 text-sm">
                                    All
                                </Badge>
                            </Link>
                            {categories.map((cat) => (
                                <Link key={cat} href={`/courses?category=${cat.toLowerCase()}`}>
                                    <Badge variant={category === cat.toLowerCase() ? "default" : "outline"} className="whitespace-nowrap py-2 px-4 text-sm">
                                        {cat}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Course Grid */}
                    <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {courses?.map((course) => (
                                <Link key={course.id} href={`/courses/${course.id}`} className="group h-full">
                                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 h-full flex flex-col transform hover:-translate-y-1">
                                        {/* Thumbnail */}
                                        <div className="aspect-video bg-slate-100 relative overflow-hidden">
                                            <CourseThumbnail
                                                src={course.thumbnail_url}
                                                title={course.title}
                                                category={course.category || "Course"}
                                                className="w-full h-full"
                                            />
                                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-xs font-bold text-indigo-600 shadow-sm">
                                                {course.category || "Course"}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5 flex flex-col flex-grow">
                                            <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                                {course.title}
                                            </h3>
                                            <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-grow">
                                                {course.description}
                                            </p>

                                            {/* Meta Info */}
                                            <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 border-t border-slate-100 pt-4">
                                                <div className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    <span className="truncate max-w-[100px]">{(course.profiles as any)?.full_name || "Instructor"}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>12h 30m</span>
                                                </div>
                                                <div className="flex items-center gap-1 ml-auto text-amber-500 font-medium">
                                                    <Star className="w-3 h-3 fill-current" />
                                                    <span>4.8</span>
                                                </div>
                                            </div>

                                            {/* Price & Action */}
                                            <div className="flex items-center justify-between mt-auto">
                                                <div className="text-lg font-bold text-slate-900">
                                                    {course.price > 0 ? `₹ ${course.price}` : "Free"}
                                                </div>
                                                <span className="text-sm font-medium text-indigo-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                                                    View Details <ChevronRight className="w-4 h-4" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}

                            {(!courses || courses.length === 0) && (
                                <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900 mb-1">No courses found</h3>
                                    <p className="text-slate-500">Try adjusting your search or filters to find what you're looking for.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
