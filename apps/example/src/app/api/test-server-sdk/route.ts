import { type NextRequest, NextResponse } from "next/server";
import { backendSDK } from "../../../lib/nexus-server";
import type { Iou } from "@daml.js/nexus-example-0.0.1/lib/Iou";

/**
 * Bu rota yeni nesil "Server-Side" Canton Client SDK'sını test eder.
 * CQRS Modeli:
 * 1. POST -> Ledger API üzerinden Canton Node'una yazma (Command).
 * 2. GET -> PQS PostgreSQL veritabanından doğrudan ultra yüksek hızda okuma (Query).
 */

export async function GET(_req: NextRequest) {
	try {
		// 1. Yeni Isomorphic Server Client üzerinden "Alice" olarak context açıyoruz.
		// (Okumalar postgres PQS üzerinden geçtiği için kimlik doğrulamasına "şeffaf" bırakılabilir,
		// ama gerçek bir auth mekanizmasında PQS seviyesinde RLS kullanılır)
		const userContext = backendSDK.withUser("alice");

		// 2. Kysely PQS Motorunu kullanarak 2 milisaniyede veriyi SQL'den çekiyoruz!
		// `findMany` metodumuz `myTypes`taki proxy'ler ile ışık hızında çalışır.
		// (Kysely filter yapısı: options.where aktifleştirildi).
		const pqsRows = await userContext.Iou.findMany({
			limit: 10,
			// where: { amount: { gt: 50 } } // PQS SQL Filtremiz
		});

		return NextResponse.json({
			status: "success",
			message: "PQS PostgreSQL üzerinden Okuma İşlemi Başarılı",
			engine: "Kysely (pg)",
			data: pqsRows,
		});
	} catch (error: unknown) {
		return NextResponse.json(
			{
				status: "error",
				message: (error as Error).message,
			},
			{ status: 500 },
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		const payload = await req.json();

		const userContext = backendSDK.withUser("alice");

		// Ledger API (HTTP JSON v2) üzerinden oluşturulmasını tetikle!
		const createdPayload = await userContext.Iou.create(payload);

		return NextResponse.json({
			status: "success",
			message: "Ledger API'ye Command (Yazma) Gönderildi",
			engine: "Native Fetch",
			data: createdPayload,
		});
	} catch (error: unknown) {
		return NextResponse.json(
			{
				status: "error",
				message: (error as Error)?.message || "Bilinmeyen Sunucu Hatası",
			},
			{ status: 500 },
		);
	}
}
