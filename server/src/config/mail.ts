import nodemailer from "nodemailer";

const getEnv = (key: string, fallbackKey: string) => {
  return process.env[key] || process.env[fallbackKey];
};

const getMailConfig = () => {
  const host = getEnv("SMTP_HOST", "MAILTRAP_HOST");
  const port = getEnv("SMTP_PORT", "MAILTRAP_PORT");
  const user = getEnv("SMTP_USER", "MAILTRAP_USER");
  const pass = getEnv("SMTP_PASS", "MAILTRAP_PASS");
  const missing = [
    ["SMTP_HOST", host],
    ["SMTP_PORT", port],
    ["SMTP_USER", user],
    ["SMTP_PASS", pass],
  ].filter(([, value]) => !value);

  if (missing.length > 0) {
    throw new Error(
      `Missing mail env variables: ${missing.map(([key]) => key).join(", ")}`,
    );
  }

  return {
    host: host as string,
    port: Number(port),
    user: user as string,
    pass: pass as string,
    from: process.env.MAIL_FROM || "GearCraft <noreply@gearcraft.test>",
  };
};

export const createMailTransport = () => {
  const config = getMailConfig();

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
};

export const sendPasswordResetEmail = async (input: {
  email: string;
  code: string;
}) => {
  const config = getMailConfig();
  const transporter = createMailTransport();

  await transporter.sendMail({
    from: config.from,
    to: input.email,
    subject: "Відновлення пароля GearCraft",
    text: `Ваш код для відновлення пароля: ${input.code}. Код дійсний 15 хвилин.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Відновлення пароля GearCraft</h2>
        <p>Ваш код для відновлення пароля:</p>
        <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${input.code}</p>
        <p>Код дійсний 15 хвилин. Якщо ви не запитували відновлення, просто ігноруйте цей лист.</p>
      </div>
    `,
  });
};
