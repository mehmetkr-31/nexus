import type { TemplateDescriptor, TemplateId } from "@nexus-framework/core";

export function isTemplateId(t: unknown): t is TemplateId {
	return !!t && typeof t === "object" && "packageId" in t;
}

export function isTemplateDescriptor(t: unknown): t is TemplateDescriptor {
	return (
		!!t && typeof t === "object" && "packageName" in t && "moduleName" in t && "entityName" in t
	);
}

export function toStableTemplateId(t: string | TemplateId | TemplateDescriptor): string {
	if (typeof t === "string") {
		return t;
	}
	if (isTemplateId(t)) {
		return `${t.packageId}:${t.moduleName}:${t.entityName}`;
	}
	if (isTemplateDescriptor(t)) {
		return `${t.packageName}:${t.moduleName}:${t.entityName}`;
	}
	return String(t);
}
