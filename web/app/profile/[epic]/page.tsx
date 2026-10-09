import { Metadata } from 'next';
import Link from 'next/link';
import { normalizeEpic, isValidEpic, formatEpicForDisplay } from '@/lib/utils';
import ProfileDisplay from '@/components/ProfileDisplay';
import EmptyState from '@/components/EmptyState';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import DashboardLayout from '../../dashboard/layout';
import { createAdminClient } from '@/lib/supabase/server';
import { Elector } from '@/lib/types';
import { resolveElectorLocation, resolveElectorSerialNumber } from '@/lib/boothMaster';

interface ProfilePageProps {
  params: {
    epic: string;
  };
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const epic = normalizeEpic(decodeURIComponent(params.epic || ''));
  const formatted = formatEpicForDisplay(epic);
  return {
    title: isValidEpic(epic)
      ? `Profile (${formatted}) — Elector Lookup`
      : 'Invalid EPIC — Elector Lookup',
    description: `Lookup profile for elector card ${formatted}`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const rawEpic = decodeURIComponent(params.epic || '');
  const epic = normalizeEpic(rawEpic);

  // 1. Format Validation Check
  if (!isValidEpic(epic)) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-red-100 p-8 text-center shadow-sm space-y-5 animate-fadeIn">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 text-red-600 border border-red-100">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-gray-900">
                Invalid EPIC Number Format
              </h1>
              <p className="text-sm text-gray-600">
                The identifier <code className="px-2 py-0.5 bg-gray-100 text-red-600 rounded font-mono font-bold text-xs">{rawEpic}</code> does not match the standard Indian electoral format.
              </p>
              <p className="text-xs text-gray-400">
                EPIC numbers must be exactly 3 uppercase letters followed by 7 digits (e.g., <strong className="text-gray-700">TYA5060587</strong>).
              </p>
            </div>

            <div>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Search</span>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 2. Query Supabase electors database table
  let elector: Elector | null = null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('electors')
      .select('*')
      .eq('epic_number', epic)
      .maybeSingle();

    if (error) {
      console.error('Supabase query error:', error);
    } else if (data) {
      const location = resolveElectorLocation(data);
      const serial = resolveElectorSerialNumber(data);
      elector = {
        ...(data as Elector),
        serial_number: serial,
        taluk: location.taluk,
        district: location.district,
        ac_name: location.ac_name,
      };
    }
  } catch (error) {
    console.error('Failed to fetch elector profile from database:', error);
  }

  // 3. Handle Not Found (Empty State)
  if (!elector) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <EmptyState epic={epic} />
        </div>
      </DashboardLayout>
    );
  }

  // 4. Render Found Profile
  return (
    <DashboardLayout>
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <ProfileDisplay elector={elector} />
      </div>
    </DashboardLayout>
  );
}
