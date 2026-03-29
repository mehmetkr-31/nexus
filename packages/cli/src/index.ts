#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cancel, intro, isCancel, outro, select, spinner, text } from "@clack/prompts";
import { Command } from "commander";
import fs from "fs-extra";
import pc from "picocolors";

const program = new Command();

program
	.name("create-nexus-app")
	.description("Build beautiful, resilient Daml applications on Canton with Nexus Framework.")
	.version("0.1.0")
	.argument("[projectName]", "Name of the project")
	.action(async (projectName: string | undefined) => {
		intro(pc.bgCyan(pc.black(" create-nexus-app ")));

		const name =
			projectName ||
			(await text({
				message: "What is your project named?",
				placeholder: "my-nexus-app",
				validate(value) {
					if (value.length === 0) return "Value is required!";
					if (fs.existsSync(path.resolve(process.cwd(), value))) {
						return "Directory already exists!";
					}
				},
			}));

		if (isCancel(name)) {
			cancel("Operation cancelled");
			return process.exit(0);
		}

		const framework = await select({
			message: "Which framework would you like to use?",
			options: [
				{ value: "nextjs", label: "Next.js (App Router)", hint: "Recommended" },
				// { value: "vite", label: "Vite (React)", hint: "Coming soon" },
			],
		});

		if (isCancel(framework)) {
			cancel("Operation cancelled");
			return process.exit(0);
		}

		const authType = await select({
			message: "Select your primary Authentication provider:",
			options: [
				{
					value: "sandbox",
					label: "Canton Sandbox (Local Development)",
					hint: "Automated provisioning",
				},
				{ value: "jwt", label: "JWT / Better Auth", hint: "Production ready" },
			],
		});

		if (isCancel(authType)) {
			cancel("Operation cancelled");
			return process.exit(0);
		}

		const targetDir = path.resolve(process.cwd(), name as string);

		const s = spinner();
		s.start(`Scaffolding ${name} for ${framework}...`);

		const __dirname = path.dirname(fileURLToPath(import.meta.url));
		const templateDir = path.resolve(__dirname, "../templates/nextjs");

		try {
			await fs.copy(templateDir, targetDir);

			// Rename all .template files back to original names recursively
			const renameRecursive = async (dir: string) => {
				const files = await fs.readdir(dir);
				for (const file of files) {
					const fullPath = path.join(dir, file);
					const stat = await fs.stat(fullPath);
					if (stat.isDirectory()) {
						await renameRecursive(fullPath);
					} else if (file.endsWith(".template")) {
						const toPath = fullPath.replace(/\.template$/, "");
						await fs.move(fullPath, toPath, { overwrite: true });
					}
				}
			};
			await renameRecursive(targetDir);

			// Replace placeholders in package.json
			const packageJsonPath = path.join(targetDir, "package.json");
			let packageJson = await fs.readFile(packageJsonPath, "utf-8");
			packageJson = packageJson.replace("{{name}}", name as string);
			await fs.writeFile(packageJsonPath, packageJson);

			// Handle Auth config in nexus-client.ts
			const clientPath = path.join(targetDir, "src/lib/nexus-client.ts");
			let clientContent = await fs.readFile(clientPath, "utf-8");
			const authPlugin =
				authType === "sandbox"
					? `sandboxAuth({
			secret: process.env.NEXT_PUBLIC_SANDBOX_SECRET ?? "secret",
			userId: NEXUS_USER_ID,
		}),`
					: `// JWT Auth placeholder (Production ready)
		// jwtAuth(),`;
			clientContent = clientContent.replace("{{authPluginConfig}}", authPlugin);
			await fs.writeFile(clientPath, clientContent);

			// Handle Server Auth config in nexus.ts
			const serverPath = path.join(targetDir, "src/lib/nexus.ts");
			let serverContent = await fs.readFile(serverPath, "utf-8");

			const serverAuthPlugin =
				authType === "sandbox"
					? `sandboxAuth({
				userId: SANDBOX_USER_ID,
				partyId,
				secret: SANDBOX_SECRET,
			}),`
					: `// JWT Auth placeholder (Production ready)
				// jwtAuth(),`;

			const provLogic =
				authType === "sandbox"
					? `try {
		const partyId = await client.auth.partyId.resolvePartyId(SANDBOX_USER_ID);
		return { client, partyId };
	} catch (err: unknown) {
		const msg = String((err as { message?: string })?.message ?? err);
		console.log(\`Provisioning sandbox user "\${SANDBOX_USER_ID}"...\`);
		const partyId = await provisionSandboxUser({
			ledgerApiUrl: CANTON_API_URL,
			userId: SANDBOX_USER_ID,
			secret: SANDBOX_SECRET,
		});
		return { client: await getServerClient(partyId), partyId };
	}`
					: `// Direct resolution for JWT/OIDC
    return { client, partyId: undefined };`;

			serverContent = serverContent.replace("{{serverAuthPluginConfig}}", serverAuthPlugin);
			serverContent = serverContent.replace("{{provisioningLogic}}", provLogic);
			await fs.writeFile(serverPath, serverContent);

			s.stop(pc.green("Project structure created!"));
		} catch (err) {
			s.stop(pc.red("Failed to create project"));
			console.error(err);
			process.exit(1);
		}

		intro(pc.bgGreen(pc.black(" NEXT STEPS ")));
		console.log(`  cd ${pc.cyan(name as string)}`);
		console.log(`  bun install`);
		console.log(`  bun run dev`);

		outro(pc.bgBlue(pc.white(` Happy building with Nexus! `)));
	});

program.parse();
