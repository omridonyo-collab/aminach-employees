import emailjs from '@emailjs/browser';
import { FormSubmission, ApprovalStep } from '@/types';
import { encodeFormToUrl } from './formUrlEncoder';

// המזהים המדויקים מהתמונות שלך:
const SERVICE_ID = 'service_pjriey4'; 
const TEMPLATE_ID_APPROVAL = 'template_5oucpjl'; // מזהה לבקשת אישור מנהל
const TEMPLATE_ID_FINAL = 'template_hhghr3v';    // מזהה למייל סופי למשאבי אנוש
const PUBLIC_KEY = '5L86K9G1Oq7_XmNlI';          // וודא שזה ה-Public Key מה-Account
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
  // משתמש ב-TEMPLATE_ID_APPROVAL
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
  // משתמש ב-TEMPLATE_ID_FINAL
  return emailjs.send(SERVICE_ID, TEMPLATE_ID_FINAL, templateParams, PUBLIC_KEY);
};
