import type {
	DamlTemplate,
	NexusTemplateIdentifier,
	TemplateDescriptor,
	TemplateId,
} from "@nexus-framework/core";

export function isTemplateId(t: unknown): t is TemplateId {
	return !!t && typeof t === "object" && "packageId" in t;
}

export function isTemplateDescriptor(t: unknown): t is TemplateDescriptor {
	return (
		!!t && typeof t === "object" && "packageName" in t && "moduleName" in t && "entityName" in t
	);
}

export function isDamlTemplate(t: unknown): t is DamlTemplate<unknown, unknown, string> {
	return !!t && typeof t === "object" && "templateId" in t && "decoder" in t;
}

export function toStableTemplateId(t: NexusTemplateIdentifier): string {
	if (typeof t === "string") {
		return t;
	}
	if (isDamlTemplate(t)) {
		// templateIdWithPackageId is present in @daml/types ≥ 3.x; fall back to templateId for v2.
		return t.templateIdWithPackageId ?? t.templateId;
	}
	if (isTemplateId(t)) {
		return `${t.packageId}:${t.moduleName}:${t.entityName}`;
	}
	if (isTemplateDescriptor(t)) {
		return `${t.packageName}:${t.moduleName}:${t.entityName}`;
	}
	return String(t);
}
