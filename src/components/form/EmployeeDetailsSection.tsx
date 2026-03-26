import { useFormContext } from 'react-hook-form'
import { SectionCard } from '@/components/ui/SectionCard'
import { format } from 'date-fns'
import { UNITS, DEPARTMENTS } from '@/data/mockData'
import type { FormSchemaType } from '@/lib/validation'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-right focus:border-aminach-accent focus:outline-none focus:ring-1 focus:ring-aminach-accent'

export function EmployeeDetailsSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormSchemaType>()

  return (
    <SectionCard title="1. פרטי עובד">
      <div className="grid gap-4 sm:grid-cols-2">

        {/* שם העובד */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">שם העובד *</label>
          <input
            {...register('employeeDetails.employeeName')}
            className={inputClass}
            placeholder="הכנס שם מלא"
          />
          {errors.employeeDetails?.employeeName && (
            <p className="mt-1 text-sm text-red-600">{errors.employeeDetails.employeeName.message}</p>
          )}
        </div>

        {/* מספר עובד */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">מספר עובד *</label>
          <input
            {...register('employeeDetails.employeeId')}
            className={inputClass}
            placeholder="EMP-12345"
          />
          {errors.employeeDetails?.employeeId && (
            <p className="mt-1 text-sm text-red-600">{errors.employeeDetails.employeeId.message}</p>
          )}
        </div>

        {/* יחידה (לשעבר: מחלקת מפעל) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">יחידה *</label>
          <select
            {...register('employeeDetails.plantDepartment')}
            className={inputClass}
          >
            <option value="">בחר יחידה</option>
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          {errors.employeeDetails?.plantDepartment && (
            <p className="mt-1 text-sm text-red-600">
              {errors.employeeDetails.plantDepartment.message}
            </p>
          )}
        </div>

        {/* מחלקה */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">מחלקה *</label>
          <select
            {...register('employeeDetails.department')}
            className={inputClass}
          >
            <option value="">בחר מחלקה</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {errors.employeeDetails?.department && (
            <p className="mt-1 text-sm text-red-600">
              {errors.employeeDetails.department.message}
            </p>
          )}
        </div>

        {/* תפקיד – מלל חופשי */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">תפקיד *</label>
          <input
            {...register('employeeDetails.position')}
            className={inputClass}
            placeholder="הכנס תפקיד"
          />
          {errors.employeeDetails?.position && (
            <p className="mt-1 text-sm text-red-600">{errors.employeeDetails.position.message}</p>
          )}
        </div>

        {/* שם מנהל ישיר – מלל חופשי */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">שם המנהל הישיר *</label>
          <input
            {...register('employeeDetails.directManagerName')}
            className={inputClass}
            placeholder="הכנס שם מנהל ישיר"
          />
          {errors.employeeDetails?.directManagerName && (
            <p className="mt-1 text-sm text-red-600">
              {errors.employeeDetails.directManagerName.message}
            </p>
          )}
        </div>

        {/* ותק */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">ותק בחברה *</label>
          <input
            {...register('employeeDetails.tenureInCompany')}
            className={inputClass}
            placeholder="למשל: 3 שנים"
          />
          {errors.employeeDetails?.tenureInCompany && (
            <p className="mt-1 text-sm text-red-600">
              {errors.employeeDetails.tenureInCompany.message}
            </p>
          )}
        </div>

        {/* תאריך מילוי */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">תאריך מילוי הטופס *</label>
          <input
            type="date"
            {...register('employeeDetails.formFillDate')}
            defaultValue={format(new Date(), 'yyyy-MM-dd')}
            className={inputClass}
          />
          {errors.employeeDetails?.formFillDate && (
            <p className="mt-1 text-sm text-red-600">
              {errors.employeeDetails.formFillDate.message}
            </p>
          )}
        </div>

      </div>
    </SectionCard>
  )
}
