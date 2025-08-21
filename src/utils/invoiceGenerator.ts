import PDFDocument from "pdfkit";
import { IBooking } from "../types";

interface InvoiceData {
  invoiceNumber: string;
  booking: IBooking;
  generatedAt: Date;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // Header
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("HOME SERVICES", { align: "center" })
        .moveDown(0.5);

      doc
        .fontSize(14)
        .font("Helvetica")
        .text("Professional Home Services Platform", { align: "center" })
        .moveDown(2);

      // Invoice details
      doc.fontSize(18).font("Helvetica-Bold").text("INVOICE").moveDown(1);

      // Invoice info
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Invoice Number: ${data.invoiceNumber}`)
        .text(`Date: ${data.generatedAt.toLocaleDateString()}`)
        .text(`Time: ${data.generatedAt.toLocaleTimeString()}`)
        .moveDown(1);

      // Customer and Provider info
      const customer = data.booking.userId as any;
      const provider = data.booking.providerId as any;
      const service = data.booking.serviceId as any;

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Customer Information:")
        .moveDown(0.5);

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Name: ${customer.firstName} ${customer.lastName}`)
        .text(`Email: ${customer.email}`)
        .text(`Phone: ${customer.phone}`)
        .moveDown(1);

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Service Provider:")
        .moveDown(0.5);

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Name: ${provider.firstName} ${provider.lastName}`)
        .text(`Email: ${provider.email}`)
        .text(`Phone: ${provider.phone}`)
        .moveDown(1);

      // Service details
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Service Details:")
        .moveDown(0.5);

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Service: ${service.title}`)
        .text(`Category: ${service.category}`)
        .text(
          `Scheduled Date: ${new Date(
            data.booking.bookingDetails.scheduledDate
          ).toLocaleDateString()}`
        )
        .text(`Scheduled Time: ${data.booking.bookingDetails.scheduledTime}`)
        .text(`Duration: ${data.booking.bookingDetails.duration} hours`)
        .moveDown(1);

      // Location
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Service Location:")
        .moveDown(0.5);

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Address: ${data.booking.bookingDetails.location.address}`)
        .text(`City: ${data.booking.bookingDetails.location.city}`)
        .text(`State: ${data.booking.bookingDetails.location.state}`)
        .moveDown(1);

      // Pricing breakdown
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Pricing Breakdown:")
        .moveDown(0.5);

      // Create pricing table
      const tableTop = doc.y;
      const tableLeft = 50;
      const colWidth = 120;

      // Table headers
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Item", tableLeft, tableTop)
        .text("Amount", tableLeft + colWidth, tableTop)
        .text("Currency", tableLeft + colWidth * 2, tableTop);

      // Table content
      const rowHeight = 20;
      let currentY = tableTop + rowHeight;

      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Base Service", tableLeft, currentY)
        .text(
          `${data.booking.pricing.basePrice.toFixed(2)}`,
          tableLeft + colWidth,
          currentY
        )
        .text(
          data.booking.pricing.currency,
          tableLeft + colWidth * 2,
          currentY
        );

      currentY += rowHeight;

      if (data.booking.pricing.additionalFees > 0) {
        doc
          .text("Additional Fees", tableLeft, currentY)
          .text(
            `${data.booking.pricing.additionalFees.toFixed(2)}`,
            tableLeft + colWidth,
            currentY
          )
          .text(
            data.booking.pricing.currency,
            tableLeft + colWidth * 2,
            currentY
          );
        currentY += rowHeight;
      }

      // Total line
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Total", tableLeft, currentY)
        .text(
          `${data.booking.pricing.totalAmount.toFixed(2)}`,
          tableLeft + colWidth,
          currentY
        )
        .text(
          data.booking.pricing.currency,
          tableLeft + colWidth * 2,
          currentY
        );

      doc.moveDown(2);

      // Payment information
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Payment Information:")
        .moveDown(0.5);

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Payment Method: ${data.booking.pricing.paymentMethod}`)
        .text(`Payment Status: ${data.booking.payment.status}`)
        .text(`Transaction ID: ${data.booking.payment.transactionId || "N/A"}`)
        .moveDown(1);

      // Special instructions
      if (data.booking.bookingDetails.specialInstructions) {
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .text("Special Instructions:")
          .moveDown(0.5);

        doc
          .fontSize(10)
          .font("Helvetica")
          .text(data.booking.bookingDetails.specialInstructions)
          .moveDown(1);
      }

      // Footer
      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Thank you for choosing Home Services!", { align: "center" })
        .moveDown(0.5)
        .text("For any questions, please contact our support team.", {
          align: "center",
        })
        .moveDown(0.5)
        .text("This is a computer-generated invoice.", { align: "center" });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
