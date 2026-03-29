import { describe, expect, test } from "bun:test";
import { CantonClient } from "../client/canton-client.ts";
import { NexusLedgerError } from "../types/index.ts";
import { CommandSubmitter } from "./command-submitter.ts";

// ─── Mock helpers ─────────────────────────────────────────────────────────────

function makeClient(handler: (req: Request) => Response | Promise<Response>) {
	const server = Bun.serve({ port: 0, fetch: handler });
	const client = new CantonClient({
		baseUrl: `http://localhost:${server.port}`,
		getToken: async () => "test-token",
	});
	return { client, server };
}

const mockSubmitResult = {
	transactionId: "txn-1",
	commandId: "cmd-1",
	offset: "0000000000000001",
	completedAt: "2026-01-01T00:00:05Z",
};

const mockTxResult = {
	transactionId: "txn-2",
	commandId: "cmd-2",
	offset: 10,
	completedAt: "2026-01-01T00:00:10Z",
	events: [
		{
			type: "exercised",
			event: {
				nodeId: 0,
				offset: 10,
				contractId: "contract-1",
				templateId: { packageId: "pkg", moduleName: "Mod", entityName: "Iou" },
				choice: "Transfer",
				choiceArgument: { newOwner: "Bob::xyz" },
				actingParties: ["Alice::abc"],
				consuming: true,
				witnessParties: ["Alice::abc", "Bob::xyz"],
				exerciseResult: { newContractId: "contract-2" },
				childNodeIds: [1],
				packageName: "my-pkg",
			},
		},
	],
};

// ─── createContract ───────────────────────────────────────────────────────────

describe("CommandSubmitter — createContract", () => {
	test("submits a create command and returns SubmitResult", async () => {
		const { client, server } = makeClient(() => Response.json(mockSubmitResult));
		const submitter = new CommandSubmitter(client);

		const result = await submitter.createContract(
			"pkg:Mod:Iou",
			{ owner: "Alice::abc", amount: "100", currency: "USD" },
			["Alice::abc"],
		);
		server.stop();

		expect(result.transactionId).toBe("txn-1");
		expect(result.offset).toBe("0000000000000001");
	});

	test("sends CreateCommand structure in request body", async () => {
		let body: Record<string, unknown> = {};
		const { client, server } = makeClient(async (req) => {
			body = (await req.json()) as Record<string, unknown>;
			return Response.json(mockSubmitResult);
		});
		const submitter = new CommandSubmitter(client);

		await submitter.createContract("pkg:Mod:Iou", { owner: "Alice::abc" }, ["Alice::abc"]);
		server.stop();

		const commands = body.commands as Array<Record<string, unknown>>;
		expect(commands).toHaveLength(1);
		expect(commands[0]).toHaveProperty("CreateCommand");
		const createCmd = commands[0]?.CreateCommand as Record<string, unknown>;
		expect(createCmd.templateId).toBe("pkg:Mod:Iou");
	});

	test("throws NexusLedgerError on rejection", async () => {
		const { client, server } = makeClient(() =>
			Response.json({ message: "Unauthorized" }, { status: 401 }),
		);
		const submitter = new CommandSubmitter(client);

		await expect(
			submitter.createContract("pkg:Mod:Iou", {}, ["Alice::abc"]),
		).rejects.toBeInstanceOf(NexusLedgerError);
		server.stop();
	});
});

// ─── exerciseChoice ───────────────────────────────────────────────────────────

describe("CommandSubmitter — exerciseChoice", () => {
	test("submits an exercise command and returns SubmitResult", async () => {
		const { client, server } = makeClient(() => Response.json(mockSubmitResult));
		const submitter = new CommandSubmitter(client);

		const result = await submitter.exerciseChoice("pkg:Mod:Iou", "contract-1", "Archive", {}, [
			"Alice::abc",
		]);
		server.stop();

		expect(result.transactionId).toBe("txn-1");
	});

	test("sends ExerciseCommand structure in request body", async () => {
		let body: Record<string, unknown> = {};
		const { client, server } = makeClient(async (req) => {
			body = (await req.json()) as Record<string, unknown>;
			return Response.json(mockSubmitResult);
		});
		const submitter = new CommandSubmitter(client);

		await submitter.exerciseChoice(
			"pkg:Mod:Iou",
			"contract-1",
			"Transfer",
			{ newOwner: "Bob::xyz" },
			["Alice::abc"],
		);
		server.stop();

		const commands = body.commands as Array<Record<string, unknown>>;
		expect(commands).toHaveLength(1);
		const exerciseCmd = commands[0]?.ExerciseCommand as Record<string, unknown>;
		expect(exerciseCmd.contractId).toBe("contract-1");
		expect(exerciseCmd.choice).toBe("Transfer");
		expect(exerciseCmd.choiceArgument).toEqual({ newOwner: "Bob::xyz" });
	});
});

// ─── exerciseAndGetResult ─────────────────────────────────────────────────────

describe("CommandSubmitter — exerciseAndGetResult", () => {
	test("returns ExerciseResult with typed exerciseResult", async () => {
		const { client, server } = makeClient(() => Response.json(mockTxResult));
		const submitter = new CommandSubmitter(client);

		const result = await submitter.exerciseAndGetResult<
			Record<string, unknown>,
			{ newContractId: string }
		>("pkg:Mod:Iou", "contract-1", "Transfer", { newOwner: "Bob::xyz" }, ["Alice::abc"]);
		server.stop();

		expect(result.transactionId).toBe("txn-2");
		expect(result.offset).toBe(10);
		expect(result.result).toEqual({ newContractId: "contract-2" });
	});

	test("hits submit-and-wait-for-transaction endpoint", async () => {
		let requestPath = "";
		const { client, server } = makeClient((req) => {
			requestPath = new URL(req.url).pathname;
			return Response.json(mockTxResult);
		});
		const submitter = new CommandSubmitter(client);

		await submitter.exerciseAndGetResult("pkg:Mod:Iou", "contract-1", "Archive", {}, [
			"Alice::abc",
		]);
		server.stop();

		expect(requestPath).toBe("/v2/commands/submit-and-wait-for-transaction");
	});

	test("result is undefined when no exercised event in response", async () => {
		const txWithNoExercised = { ...mockTxResult, events: [] };
		const { client, server } = makeClient(() => Response.json(txWithNoExercised));
		const submitter = new CommandSubmitter(client);

		const result = await submitter.exerciseAndGetResult(
			"pkg:Mod:Iou",
			"contract-1",
			"Archive",
			{},
			["Alice::abc"],
		);
		server.stop();

		expect(result.result).toBeUndefined();
	});

	test("throws NexusLedgerError on rejection", async () => {
		const { client, server } = makeClient(() =>
			Response.json({ message: "Contract not active" }, { status: 409 }),
		);
		const submitter = new CommandSubmitter(client);

		await expect(
			submitter.exerciseAndGetResult("pkg:Mod:Iou", "bad-id", "Archive", {}, ["Alice::abc"]),
		).rejects.toBeInstanceOf(NexusLedgerError);
		server.stop();
	});
});

// ─── submitBatch ──────────────────────────────────────────────────────────────

describe("CommandSubmitter — submitBatch", () => {
	test("sends multiple commands in a single transaction", async () => {
		let body: Record<string, unknown> = {};
		const { client, server } = makeClient(async (req) => {
			body = (await req.json()) as Record<string, unknown>;
			return Response.json(mockSubmitResult);
		});
		const submitter = new CommandSubmitter(client);

		await submitter.submitBatch(
			[
				{ type: "create", templateId: "pkg:Mod:Iou", createArguments: { owner: "Alice" } },
				{
					type: "exercise",
					templateId: "pkg:Mod:Iou",
					contractId: "c1",
					choice: "Archive",
					choiceArgument: {},
				},
			],
			["Alice::abc"],
		);
		server.stop();

		const commands = body.commands as unknown[];
		expect(commands).toHaveLength(2);
	});
});
