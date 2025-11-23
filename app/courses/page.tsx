import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, User } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

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
        .eq("is_published", true);

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
    ];

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
                <div className="container mx-auto py-4 flex justify-between items-center">
                    <Link href="/" className="font-bold text-xl flex items-center gap-2">
                        <BookOpen className="h-6 w-6" />
                        <span>Math4Code LMS</span>
                    </Link>
                    <div className="flex gap-4">
                        <Link href="/auth/login">
                            <Button variant="ghost">Log in</Button>
                        </Link>
                        <Link href="/auth/signup">
                            <Button>Sign up</Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="container mx-auto py-10">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
                        Find the perfect course for you
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Explore our wide range of courses taught by expert instructors.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-8 mb-10">
                    <div className="w-full md:w-1/4 space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2">Search</h3>
                            <form className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    name="q"
                                    placeholder="Search courses..."
                                    className="pl-8"
                                    defaultValue={q}
                                />
                            </form>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Categories</h3>
                            <div className="flex flex-wrap gap-2">
                                <Link href="/courses">
                                    <Badge variant={!category ? "default" : "secondary"}>
                                        All
                                    </Badge>
                                </Link>
                                {categories.map((cat) => (
                                    <Link key={cat} href={`/courses?category=${cat.toLowerCase()}`}>
                                        <Badge
                                            variant={
                                                category === cat.toLowerCase() ? "default" : "secondary"
                                            }
                                        >
                                            {cat}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-3/4">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {courses?.map((course) => (
                                <Link key={course.id} href={`/courses/${course.id}`}>
                                    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
                                        <div className="aspect-video bg-muted relative overflow-hidden rounded-t-lg">
                                            {course.thumbnail_url ? (
                                                <img
                                                    src={course.thumbnail_url}
                                                    alt={course.title}
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                                    <BookOpen className="h-12 w-12" />
                                                </div>
                                            )}
                                        </div>
                                        <CardHeader>
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="outline">{course.category}</Badge>
                                                <span className="font-bold text-primary">
                                                    {course.price > 0 ? `$${course.price}` : "Free"}
                                                </span>
                                            </div>
                                            <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                                            <CardDescription className="line-clamp-2">
                                                {course.description}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-grow">
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <User className="mr-2 h-4 w-4" />
                                                {(course.profiles as any)?.full_name || "Instructor"}
                                            </div>
                                        </CardContent>
                                        <CardFooter>
                                            <Button className="w-full">View Course</Button>
                                        </CardFooter>
                                    </Card>
                                </Link>
                            ))}

                            {(!courses || courses.length === 0) && (
                                <div className="col-span-full text-center py-12">
                                    <p className="text-muted-foreground">
                                        No courses found matching your criteria.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
