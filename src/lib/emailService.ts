import emailjs from '@emailjs/browser';
import { FormSubmission, ApprovalStep } from '@/types';
import { encodeFormToUrl } from './formUrlEncoder';

// פרטי התחברות - וודא שהם זהים ל-Dashboard שלך
const SERVICE_ID = 'service_6v8lb8u'; 
const TEMPLATE_ID = 'template_9o9u06p'; 
const PUBLIC_KEY = '5L86K9G1Oq7_XmNlI';
const HR_EMAIL = 'romi@aminach.co.il';

export const sendApprovalRequestEmail = async (form: FormSubmission, nextStep: ApprovalStep) => {
  const formLink = encodeFormToUrl(form);
  
  const templateParams = {
    to_email: nextStep.managerEmail,
    to_name: nextStep.managerName || nextStep.title,
    from_name: "רומי - משאבי אנוש עמינח", // הזהות המוצגת
    employee_name: form.employeeDetails.employeeName,
    form_link: formLink,
    reply_to: HR_EMAIL, 
  };

  console.log("נסיו לשלוח מייל ל:", nextStep.managerEmail);

  try {
    const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log("מייל נשלח בהצלחה!", result.status, result.text);
    return result;
  } catch (error) {
    console.error("שגיאה קריטית בשליחת מייל:", error);
    throw error;
  }
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

  try {
    const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log("מייל סופי נשלח לרומי!", result.status, result.text);
    return result;
  } catch (error) {
    console.error("שגיאה בשליחת מייל סופי:", error);
    throw error;
  }
};
