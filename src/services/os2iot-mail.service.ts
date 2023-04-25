import { ErrorCodes } from "@enum/error-codes.enum";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

@Injectable()
export class OS2IoTMail {
    private readonly logger = new Logger(OS2IoTMail.name);

    // Transporter is re-usable, so we hold on to a reference to it, after the first time we have created and verified it
    private transporter?: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;

    constructor(private configService: ConfigService) {}

    public sendMail = async (
        mailOptions: Mail.Options
    ): Promise<SMTPTransport.SentMessageInfo> => {
        await this.checkCreateBasicMailTransporter();
        if (!mailOptions.from) {
            mailOptions.from = this.configService.get<string>("email.from");
        }
        try {
            return await this.transporter.sendMail(mailOptions);
        } catch (error) {
            this.logger.error(
                "Send mail failed. To: " + mailOptions?.to +
                    ", Subject: " + mailOptions?.subject +
                    ", Error: " + JSON.stringify(error)
            );
            throw new BadRequestException(ErrorCodes.SendMailError);
        }
    };

    public sendMailChecked = async (
        mailOptions: Mail.Options
    ): Promise<SMTPTransport.SentMessageInfo> => {
        const response = await this.sendMail(mailOptions);
        const messageId = response?.messageId;
        if (response?.response) {
            this.logger.verbose(
                "Send-mail (messageId: " + messageId + ") response: " + response.response
            );
        }
        if (response?.rejected?.length) {
            this.logger.error(
                "Not all mail-recipients were accepted by SMPT-server. To: " + mailOptions.to +
                    ", Subject: " + mailOptions.subject +
                    ", MessageId: " + messageId +
                    ", RejectedAddresses: " + response.rejected
            );
            throw new BadRequestException(ErrorCodes.SendMailError);
        }
        console.log('SENT MAIL', response);
        return response;
    };

    private checkCreateBasicMailTransporter = async () => {
        if (!this.transporter) {
            const t = nodemailer.createTransport({
                host: this.configService.get<string>("email.host"),
                port: this.configService.get<number>("email.port"),
                auth: {
                    user: this.configService.get<string>("email.user"),
                    pass: this.configService.get<string>("email.pass"),
                },
            });

            try {
                await t.verify();
            } catch (error) {
                throw new BadRequestException(ErrorCodes.SendMailError);
            }

            this.transporter = t;
        }
    };
}
