'use client'

import React from 'react'
import { SchoolManagement } from '@/components/admin/SchoolManagement'

export default function AdminSchoolsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#051424] overflow-y-auto pb-10">
      <div className="p-6">
        <SchoolManagement />
      </div>
    </div>
  )
}
