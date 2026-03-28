import emailjs from '@emailjs/browser';
import { FormSubmission, ApprovalStep } from '@/types';
import { encodeFormToUrl } from './formUrlEncoder';

// פרטי החשבון המעודכנים לפי צילומי המסך שלך
const SERVICE_ID = 'service_pjriey4'; 
const TEMPLATE_ID_APPROVAL = 'template_5oucpjl'; 
const TEMPLATE_ID_FINAL = 'template_hhghr3v';    
const PUBLIC_KEY = 'C5ww_SnR_9HjraTg2'; // המפתח החדש והמעודכן
const HR_EMAIL = 'romi@aminach.co.il';

export const sendApprovalRequestEmail = async (form: FormSubmission, nextStep: ApprovalStep) => {
  const formLink = encodeFormToUrl(form);
  const templateParams = {
    to_email: nextStep.managerEmail,
    to_name: nextStep.managerName || nextStep.title,
    from_name: "רומי - משאבי אנוש עמינח",
    employee_name: form.employeeDetails.employeeName,
    form_link: formLink,
    reply_to: HR_EMAIL,
  };
  return emailjs.send(SERVICE_ID, TEMPLATE_ID_APPROVAL, templateParams, PUBLIC_KEY);
};

export const sendHrFinalEmail = async (form: FormSubmission) => {
  const formLink = encodeFormToUrl(form);
  const templateParams = {
    to_email: HR_EMAIL,
    to_name: "רומי",
    from_name: "מערכת אישורי שכר",
    employee_name: form.employeeDetails.employeeName,
    form_link: formLink,
    reply_to: HR_EMAIL,
  };
  return emailjs.send(SERVICE_ID, TEMPLATE_ID_FINAL, templateParams, PUBLIC_KEY);
};
