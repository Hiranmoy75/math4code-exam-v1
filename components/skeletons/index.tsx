export function CourseCardSkeleton() {
    return (
        <div className="min-w-[300px] md:min-w-[340px] bg-white rounded-2xl shadow-lg border border-gray-100 p-6 snap-center animate-pulse">
            <div className="flex justify-between items-start mb-4">
                <div className="h-6 w-20 bg-gray-200 rounded-full" />
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            </div>

            <div className="h-6 w-3/4 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-full bg-gray-100 rounded mb-1" />
            <div className="h-4 w-2/3 bg-gray-100 rounded mb-4" />

            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4" />

            <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-6 w-16 bg-gray-200 rounded" />
            </div>
        </div>
    );
}

export function ExamCardSkeleton() {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 animate-pulse">
            <div className="h-5 w-3/4 bg-gray-200 rounded mb-3" />
            <div className="h-4 w-full bg-gray-100 rounded mb-2" />
            <div className="h-4 w-2/3 bg-gray-100 rounded mb-4" />

            <div className="h-3 w-32 bg-gray-100 rounded mb-4" />

            <div className="flex justify-between items-center">
                <div className="h-6 w-16 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>
        </div>
    );
}

export function TableRowSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-100 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-lg" />
            <div className="flex-1">
                <div className="h-5 w-1/3 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-1/2 bg-gray-100 rounded" />
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded" />
        </div>
    );
}

export function QuestionCardSkeleton() {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 animate-pulse">
            <div className="flex justify-between items-start mb-4">
                <div className="h-5 w-24 bg-gray-200 rounded" />
                <div className="h-5 w-16 bg-gray-200 rounded" />
            </div>

            <div className="h-4 w-full bg-gray-100 rounded mb-2" />
            <div className="h-4 w-5/6 bg-gray-100 rounded mb-4" />

            <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 bg-gray-50 rounded-lg" />
                ))}
            </div>
        </div>
    );
}

export function DashboardStatSkeleton() {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 animate-pulse">
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                <div className="h-4 w-16 bg-gray-100 rounded" />
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
        </div>
    );
}
