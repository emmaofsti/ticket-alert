import { NextRequest, NextResponse } from 'next/server';
import { getUpcomingConcerts } from '@/lib/ticketmaster';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword') || undefined;
    const category = searchParams.get('category') || 'all';
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 0;
    const size = searchParams.get('size')
        ? parseInt(searchParams.get('size')!)
        : 200;

    try {
        const result = await getUpcomingConcerts({ keyword, size, category, page });

        return NextResponse.json({
            concerts: result.concerts,
            total: result.totalElements,
            totalPages: result.totalPages,
            currentPage: result.currentPage,
        });
    } catch (error) {
        console.error('Failed to fetch concerts:', error);
        return NextResponse.json(
            { error: 'Kunne ikke hente konserter' },
            { status: 500 }
        );
    }
}
