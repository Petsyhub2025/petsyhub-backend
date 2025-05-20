export type ISendEmail = ISendTextEmail | ISendTemplateEmail;

interface IBaseSendEmail {
  emails: string | string[];
  subject: string;
  body?: string;
  template?: string;
}

interface ISendTextEmail extends IBaseSendEmail {
  body: string;
  template?: never;
}

interface ISendTemplateEmail extends IBaseSendEmail {
  template: string;
  body?: never;
}
