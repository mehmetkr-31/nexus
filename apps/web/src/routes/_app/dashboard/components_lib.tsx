"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@nexus/ui/components/alert-dialog";
import {
	Avatar,
	AvatarFallback,
	AvatarGroup,
	AvatarGroupCount,
	AvatarImage,
} from "@nexus/ui/components/avatar";
import { Badge } from "@nexus/ui/components/badge";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@nexus/ui/components/breadcrumb";
import { Button } from "@nexus/ui/components/button";
import { Calendar } from "@nexus/ui/components/calendar";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@nexus/ui/components/card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@nexus/ui/components/carousel";
import {
	ChartContainer,
	ChartLegend,
	ChartTooltip,
	ChartTooltipContent,
} from "@nexus/ui/components/chart";
import { Checkbox } from "@nexus/ui/components/checkbox";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@nexus/ui/components/collapsible";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@nexus/ui/components/command";
import {
	ContextMenu,
	ContextMenuCheckboxItem,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuTrigger,
} from "@nexus/ui/components/context-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@nexus/ui/components/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@nexus/ui/components/drawer";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "@nexus/ui/components/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@nexus/ui/components/hover-card";
import { Input } from "@nexus/ui/components/input";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from "@nexus/ui/components/input-otp";
import { Label } from "@nexus/ui/components/label";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from "@nexus/ui/components/navigation-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@nexus/ui/components/popover";
import { Progress } from "@nexus/ui/components/progress";
import { RadioGroup, RadioGroupItem } from "@nexus/ui/components/radio-group";
import { ScrollArea, ScrollBar } from "@nexus/ui/components/scroll-area";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@nexus/ui/components/select";
import { Separator } from "@nexus/ui/components/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@nexus/ui/components/sheet";
import { Skeleton } from "@nexus/ui/components/skeleton";
import { Slider } from "@nexus/ui/components/slider";
import { Switch } from "@nexus/ui/components/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@nexus/ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@nexus/ui/components/tabs";
import { Textarea } from "@nexus/ui/components/textarea";
import { Toggle } from "@nexus/ui/components/toggle";
import { ToggleGroup, ToggleGroupItem } from "@nexus/ui/components/toggle-group";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@nexus/ui/components/tooltip";
import { createFileRoute } from "@tanstack/react-router";
import {
	AlignCenterIcon,
	AlignLeftIcon,
	AlignRightIcon,
	BellIcon,
	BoldIcon,
	BookOpenIcon,
	BoxesIcon,
	ChevronDownIcon,
	CopyIcon,
	HeartIcon,
	ItalicIcon,
	LayoutDashboardIcon,
	MapPinIcon,
	PlusIcon,
	SearchIcon,
	SettingsIcon,
	StrikethroughIcon,
	TrashIcon,
	UnderlineIcon,
	UserIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/dashboard/components_lib")({
	component: RouteComponent,
});

const chartConfig = {
	desktop: { label: "Desktop", color: "hsl(var(--primary))" },
	mobile: { label: "Mobile", color: "hsl(var(--muted-foreground))" },
};

const components = [
	{
		id: "alert-dialog",
		title: "Alert Dialog",
		description: "A dialog that interrupts the user with important information.",
		content: <AlertDialogDemo />,
	},
	{
		id: "aspect-ratio",
		title: "Aspect Ratio",
		description: "Displays content within a desired ratio.",
		content: (
			<div className="w-full max-w-md overflow-hidden rounded-lg border">
				<div className="grid grid-cols-2 gap-2">
					<div className="overflow-hidden rounded-md">
						<div className="aspect-square w-full bg-muted flex items-center justify-center">
							<span className="text-xs text-muted-foreground">1:1</span>
						</div>
					</div>
					<div className="overflow-hidden rounded-md">
						<div className="aspect-video w-full bg-muted flex items-center justify-center">
							<span className="text-xs text-muted-foreground">16:9</span>
						</div>
					</div>
				</div>
			</div>
		),
	},
	{
		id: "avatar",
		title: "Avatar",
		description: "An image element with a fallback for loading and error states.",
		content: (
			<>
				<div className="flex items-center gap-4">
					<Avatar>
						<AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
						<AvatarFallback>CN</AvatarFallback>
					</Avatar>
					<Avatar size="sm">
						<AvatarFallback>SM</AvatarFallback>
					</Avatar>
					<Avatar size="lg">
						<AvatarFallback>LG</AvatarFallback>
					</Avatar>
				</div>
				<div className="mt-4">
					<AvatarGroup>
						<Avatar>
							<AvatarImage src="https://github.com/vercel.png" alt="Vercel" />
							<AvatarFallback>V</AvatarFallback>
						</Avatar>
						<Avatar>
							<AvatarImage src="https://github.com/nextjs.png" alt="Next.js" />
							<AvatarFallback>N</AvatarFallback>
						</Avatar>
						<Avatar>
							<AvatarImage src="https://github.com/react.png" alt="React" />
							<AvatarFallback>R</AvatarFallback>
						</Avatar>
						<AvatarGroupCount>+5</AvatarGroupCount>
					</AvatarGroup>
				</div>
			</>
		),
	},
	{
		id: "badge",
		title: "Badge",
		description: "Displays a badge or a component that looks like a badge.",
		content: (
			<div className="flex flex-wrap items-center gap-2">
				<Badge>Default</Badge>
				<Badge variant="secondary">Secondary</Badge>
				<Badge variant="destructive">Destructive</Badge>
				<Badge variant="outline">Outline</Badge>
				<Badge variant="ghost">Ghost</Badge>
			</div>
		),
	},
	{
		id: "breadcrumb",
		title: "Breadcrumb",
		description: "Displays the path to the current resource using a hierarchy of links.",
		content: (
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink href="/">Home</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink href="/components">Components</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbPage>Breadcrumb</BreadcrumbPage>
				</BreadcrumbList>
			</Breadcrumb>
		),
	},
	{
		id: "button",
		title: "Button",
		description: "Displays a button or a component that resembles a button.",
		content: (
			<>
				<div className="flex flex-wrap items-center gap-4">
					<Button>Default</Button>
					<Button variant="secondary">Secondary</Button>
					<Button variant="destructive">Destructive</Button>
					<Button variant="outline">Outline</Button>
					<Button variant="ghost">Ghost</Button>
					<Button variant="link">Link</Button>
				</div>
				<div className="mt-4 flex flex-wrap items-center gap-4">
					<Button size="xs">Extra Small</Button>
					<Button size="sm">Small</Button>
					<Button size="default">Default</Button>
					<Button size="lg">Large</Button>
					<Button size="icon-xs">
						<HeartIcon />
					</Button>
					<Button size="icon-sm">
						<HeartIcon />
					</Button>
					<Button size="icon">
						<HeartIcon />
					</Button>
					<Button size="icon-lg">
						<HeartIcon />
					</Button>
				</div>
			</>
		),
	},
	{
		id: "calendar",
		title: "Calendar",
		description: "A date picker component for selecting dates.",
		content: <CalendarDemo />,
	},
	{
		id: "card",
		title: "Card",
		description: "Displays a card with header, content, and footer.",
		content: (
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Card Title</CardTitle>
					<CardDescription>Card description goes here.</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Card content area with various elements.</p>
				</CardContent>
				<CardFooter className="border-t pt-4">
					<Button variant="outline" size="sm">
						Cancel
					</Button>
					<Button size="sm">Confirm</Button>
				</CardFooter>
			</Card>
		),
	},
	{
		id: "carousel",
		title: "Carousel",
		description: "A carousel component for browsing through a collection of items.",
		content: <CarouselDemo />,
	},
	{
		id: "chart",
		title: "Chart",
		description: "Displays charts using Recharts.",
		content: (
			<ChartContainer config={chartConfig} className="h-[200px] w-full">
				<div className="h-full w-full">
					<ChartTooltip content={<ChartTooltipContent />} />
					<ChartLegend />
				</div>
			</ChartContainer>
		),
	},
	{
		id: "checkbox",
		title: "Checkbox",
		description: "A control that allows the user to toggle between checked and unchecked states.",
		content: (
			<div className="flex items-center gap-4">
				<Checkbox id="terms" />
				<Label htmlFor="terms">Accept terms and conditions</Label>
			</div>
		),
	},
	{
		id: "collapsible",
		title: "Collapsible",
		description: "An interactive component which expands/collapses a content panel.",
		content: <CollapsibleDemo />,
	},
	{
		id: "command",
		title: "Command",
		description: "A command palette component for quick actions.",
		content: <CommandDemo />,
	},
	{
		id: "context-menu",
		title: "Context Menu",
		description: "A menu that appears upon right-click or long press.",
		content: <ContextMenuDemo />,
	},
	{
		id: "dialog",
		title: "Dialog",
		description: "A window overlaid on the primary content.",
		content: <DialogDemo />,
	},
	{
		id: "dialog-sheet",
		title: "Dialog / Sheet",
		description: "A window overlaid on the primary content.",
		content: <SheetDemo />,
	},
	{
		id: "drawer",
		title: "Drawer",
		description: "A drawer component for mobile-like navigation.",
		content: <DrawerDemo />,
	},
	{
		id: "dropdown-menu",
		title: "Dropdown Menu",
		description: "Displays a menu to the user, such as a set of actions or options.",
		content: (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline">Open Menu</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-56">
					<DropdownMenuLabel>My Account</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem>
							<UserIcon className="size-4" />
							<span>Profile</span>
							<DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
						</DropdownMenuItem>
						<DropdownMenuItem>
							<BoldIcon className="size-4" />
							<span>Billing</span>
							<DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
						</DropdownMenuItem>
						<DropdownMenuItem>
							<SettingsIcon className="size-4" />
							<span>Settings</span>
							<DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
						</DropdownMenuItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuCheckboxItem checked>Checkbox Item</DropdownMenuCheckboxItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem variant="destructive">
						<TrashIcon className="size-4" />
						<span>Delete</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		),
	},
	{
		id: "hover-card",
		title: "Hover Card",
		description: "A card that appears on hover.",
		content: <HoverCardDemo />,
	},
	{
		id: "input",
		title: "Input",
		description: "Displays a form input field.",
		content: (
			<div className="flex w-full max-w-md flex-col gap-2">
				<Input type="email" placeholder="Email" />
				<Input type="password" placeholder="Password" />
				<Input type="search" placeholder="Search..." />
				<Input type="file" />
			</div>
		),
	},
	{
		id: "input-otp",
		title: "Input OTP",
		description: "A one-time password input field.",
		content: <InputOTPDemo />,
	},
	{
		id: "label",
		title: "Label",
		description: "Displays a label for a form element.",
		content: (
			<div className="flex w-full max-w-md flex-col gap-3">
				<div className="flex items-center gap-2">
					<Checkbox id="r1" />
					<Label htmlFor="r1">Accept terms and conditions</Label>
				</div>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="email">Email</Label>
					<Input id="email" type="email" placeholder="Email" />
				</div>
			</div>
		),
	},
	{
		id: "navigation-menu",
		title: "Navigation Menu",
		description: "A navigation menu component.",
		content: <NavigationMenuDemo />,
	},
	{
		id: "popover",
		title: "Popover",
		description: "A popup that displays additional content.",
		content: <PopoverDemo />,
	},
	{
		id: "progress",
		title: "Progress",
		description: "Displays the progress of a task.",
		content: <ProgressDemo />,
	},
	{
		id: "radio-group",
		title: "Radio Group",
		description: "A set of radio buttons.",
		content: <RadioGroupDemo />,
	},
	{
		id: "scroll-area",
		title: "Scroll Area",
		description: "A scrollable area with custom scrollbar.",
		content: <ScrollAreaDemo />,
	},
	{
		id: "select",
		title: "Select",
		description: "Displays a select component.",
		content: <SelectDemo />,
	},
	{
		id: "separator",
		title: "Separator",
		description: "Displays a horizontal or vertical divider.",
		content: (
			<div className="space-y-4">
				<div className="flex items-center gap-4">
					<span>Left</span>
					<Separator orientation="vertical" className="h-6" />
					<span>Center</span>
					<Separator orientation="vertical" className="h-6" />
					<span>Right</span>
				</div>
				<Separator />
			</div>
		),
	},
	{
		id: "sheet",
		title: "Sheet",
		description: "A sheet component for overlaying content.",
		content: <SheetDemo />,
	},
	{
		id: "skeleton",
		title: "Skeleton",
		description: "Displays a placeholder preview of component's loading state.",
		content: (
			<>
				<div className="flex items-center gap-4">
					<Skeleton className="size-12 rounded-full" />
					<div className="space-y-2">
						<Skeleton className="h-4 w-[200px]" />
						<Skeleton className="h-4 w-[150px]" />
					</div>
				</div>
				<div className="mt-4 grid grid-cols-3 gap-4">
					<Skeleton className="h-20" />
					<Skeleton className="h-20" />
					<Skeleton className="h-20" />
				</div>
			</>
		),
	},
	{
		id: "slider",
		title: "Slider",
		description: "A slider component for selecting values.",
		content: <SliderDemo />,
	},
	{
		id: "switch",
		title: "Switch",
		description: "A toggle switch component.",
		content: <SwitchDemo />,
	},
	{
		id: "table",
		title: "Table",
		description: "Displays data in a tabular format.",
		content: (
			<Table className="w-full max-w-md">
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Role</TableHead>
						<TableHead>Status</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow>
						<TableCell className="font-medium">Alice Johnson</TableCell>
						<TableCell>Developer</TableCell>
						<TableCell>
							<Badge variant="secondary">Active</Badge>
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell className="font-medium">Bob Smith</TableCell>
						<TableCell>Designer</TableCell>
						<TableCell>
							<Badge variant="outline">Away</Badge>
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell className="font-medium">Carol White</TableCell>
						<TableCell>Manager</TableCell>
						<TableCell>
							<Badge variant="destructive">Offline</Badge>
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		),
	},
	{
		id: "tabs",
		title: "Tabs",
		description: "A set of layered sections of content.",
		content: <TabsDemo />,
	},
	{
		id: "textarea",
		title: "Textarea",
		description: "A multi-line text input field.",
		content: <TextareaDemo />,
	},
	{
		id: "toggle",
		title: "Toggle",
		description: "A two-state button that can be toggled on or off.",
		content: (
			<>
				<div className="flex flex-wrap items-center gap-4">
					<Toggle aria-label="Toggle bold">
						<BoldIcon className="size-4" />
					</Toggle>
					<Toggle aria-label="Toggle italic" defaultPressed>
						<ItalicIcon className="size-4" />
					</Toggle>
					<Toggle aria-label="Toggle underline">
						<UnderlineIcon className="size-4" />
					</Toggle>
					<Toggle aria-label="Toggle strikethrough">
						<StrikethroughIcon className="size-4" />
					</Toggle>
				</div>
				<div className="mt-4 flex flex-wrap items-center gap-4">
					<Toggle variant="outline" aria-label="Toggle bold">
						<BoldIcon className="size-4" />
					</Toggle>
					<Toggle variant="outline" aria-label="Toggle italic" defaultPressed>
						<ItalicIcon className="size-4" />
					</Toggle>
				</div>
				<div className="mt-4">
					<ToggleGroup type="single" defaultValue="center">
						<ToggleGroupItem value="left" aria-label="Align left">
							<AlignLeftIcon className="size-4" />
						</ToggleGroupItem>
						<ToggleGroupItem value="center" aria-label="Align center">
							<AlignCenterIcon className="size-4" />
						</ToggleGroupItem>
						<ToggleGroupItem value="right" aria-label="Align right">
							<AlignRightIcon className="size-4" />
						</ToggleGroupItem>
					</ToggleGroup>
				</div>
			</>
		),
	},
	{
		id: "tooltip",
		title: "Tooltip",
		description: "A popup that displays information related to an element.",
		content: (
			<TooltipProvider>
				<div className="flex gap-4">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button variant="outline">Hover Me</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>This is a tooltip</p>
						</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button variant="outline" size="icon">
								<HeartIcon className="size-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Like</p>
						</TooltipContent>
					</Tooltip>
				</div>
			</TooltipProvider>
		),
	},
	{
		id: "toast",
		title: "Toast (Sonner)",
		description: "A notification component.",
		content: (
			<div className="flex flex-wrap gap-2">
				<Button variant="outline" onClick={() => toast.success("Event has been created.")}>
					Success Toast
				</Button>
				<Button variant="outline" onClick={() => toast.error("Event has not been created.")}>
					Error Toast
				</Button>
				<Button variant="outline" onClick={() => toast("Default toast message")}>
					Default Toast
				</Button>
			</div>
		),
	},
];

function AlertDialogDemo() {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="outline">Delete Account</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete your account and remove your
						data from our servers.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction variant="destructive">Continue</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function CalendarDemo() {
	const [date, setDate] = useState<Date | undefined>(new Date());
	return (
		<Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
	);
}

function CarouselDemo() {
	return (
		<Carousel className="w-full max-w-xs">
			<CarouselContent>
				{Array.from({ length: 5 }).map((_, index) => (
					<CarouselItem key={index}>
						<div className="flex aspect-square items-center justify-center rounded-lg border bg-muted">
							<span className="text-2xl font-semibold">{index + 1}</span>
						</div>
					</CarouselItem>
				))}
			</CarouselContent>
			<CarouselPrevious />
			<CarouselNext />
		</Carousel>
	);
}

function CollapsibleDemo() {
	const [open, setOpen] = useState(false);
	return (
		<Collapsible open={open} onOpenChange={setOpen} className="w-full max-w-md space-y-2">
			<div className="flex items-center justify-between rounded-md border p-4">
				<div className="flex flex-col">
					<span className="font-medium">@radix-ui/primitives</span>
					<span className="text-sm text-muted-foreground">Official Radix UI primitives</span>
				</div>
				<CollapsibleTrigger>
					<Button variant="ghost" size="icon-sm">
						<ChevronDownIcon
							className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
						/>
					</Button>
				</CollapsibleTrigger>
			</div>
			<CollapsibleContent className="rounded-md border p-4">
				<div className="flex flex-col gap-2 text-sm">
					<p>
						Components: Accordion, Alert Dialog, Avatar, Context Menu, Dialog, Dropdown Menu, Hover
						Card, Navigation Menu, Popover, Progress, Radio Group, Scroll Area, Select, Separator,
						Slider, Switch, Tabs, Tooltip, etc.
					</p>
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}

function CommandDemo() {
	const [open, setOpen] = useState(false);
	return (
		<>
			<Button variant="outline" onClick={() => setOpen(true)}>
				<SearchIcon className="size-4 mr-2" />
				Search...
			</Button>
			<CommandDialog open={open} onOpenChange={setOpen}>
				<CommandInput placeholder="Type a command or search..." />
				<CommandList>
					<CommandEmpty>No results found.</CommandEmpty>
					<CommandGroup heading="Suggestions">
						<CommandItem>
							<UserIcon className="size-4 mr-2" />
							<span>Profile</span>
						</CommandItem>
						<CommandItem>
							<BellIcon className="size-4 mr-2" />
							<span>Notifications</span>
						</CommandItem>
						<CommandItem>
							<SettingsIcon className="size-4 mr-2" />
							<span>Settings</span>
						</CommandItem>
					</CommandGroup>
					<CommandSeparator />
					<CommandGroup heading="Actions">
						<CommandItem>
							<PlusIcon className="size-4 mr-2" />
							<span>Create New</span>
						</CommandItem>
						<CommandItem>
							<CopyIcon className="size-4 mr-2" />
							<span>Duplicate</span>
						</CommandItem>
					</CommandGroup>
				</CommandList>
			</CommandDialog>
		</>
	);
}

function ContextMenuDemo() {
	return (
		<div className="flex items-center justify-center">
			<ContextMenu>
				<ContextMenuTrigger className="flex items-center justify-center rounded-md border border-dashed p-8 w-full max-w-xs">
					<span className="text-sm text-muted-foreground">Right-click here</span>
				</ContextMenuTrigger>
				<ContextMenuContent className="w-48">
					<ContextMenuItem>
						<UserIcon className="size-4 mr-2" />
						Profile
						<ContextMenuShortcut>⌘P</ContextMenuShortcut>
					</ContextMenuItem>
					<ContextMenuItem>
						<BoldIcon className="size-4 mr-2" />
						Billing
						<ContextMenuShortcut>⌘B</ContextMenuShortcut>
					</ContextMenuItem>
					<ContextMenuItem>
						<SettingsIcon className="size-4 mr-2" />
						Settings
						<ContextMenuShortcut>⌘S</ContextMenuShortcut>
					</ContextMenuItem>
					<ContextMenuSeparator />
					<ContextMenuCheckboxItem checked>Auto-save</ContextMenuCheckboxItem>
					<ContextMenuSeparator />
					<ContextMenuItem variant="destructive">
						<TrashIcon className="size-4 mr-2" />
						Delete
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		</div>
	);
}

function DialogDemo() {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline">Open Dialog</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Profile</DialogTitle>
					<DialogDescription>
						Make changes to your profile here. Click save when you're done.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="name" className="text-right">
							Name
						</Label>
						<Input id="name" defaultValue="Alice Johnson" className="col-span-3" />
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="username" className="text-right">
							Username
						</Label>
						<Input id="username" defaultValue="@alice" className="col-span-3" />
					</div>
				</div>
				<DialogFooter>
					<Button type="submit">Save changes</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function DrawerDemo() {
	const [open, setOpen] = useState(false);
	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerTrigger asChild>
				<Button>Open Drawer</Button>
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Drawer Title</DrawerTitle>
					<DrawerDescription>This is a drawer component for overlaying content.</DrawerDescription>
				</DrawerHeader>
				<div className="p-4 space-y-4">
					<Button className="w-full" onClick={() => setOpen(false)}>
						Action 1
					</Button>
					<Button variant="secondary" className="w-full" onClick={() => setOpen(false)}>
						Action 2
					</Button>
				</div>
			</DrawerContent>
		</Drawer>
	);
}

function HoverCardDemo() {
	return (
		<div className="flex items-center justify-center">
			<HoverCard>
				<HoverCardTrigger asChild>
					<Button variant="link">@radixui</Button>
				</HoverCardTrigger>
				<HoverCardContent>
					<div className="flex justify-between space-x-4">
						<Avatar>
							<AvatarImage src="https://github.com/radix-ui.png" />
							<AvatarFallback>R</AvatarFallback>
						</Avatar>
						<div className="space-y-1">
							<h4 className="text-sm font-semibold">@radix-ui</h4>
							<p className="text-sm text-muted-foreground">
								Unstyled, accessible UI component primitives.
							</p>
							<div className="flex items-center pt-2 gap-2">
								<MapPinIcon className="size-4" />
								<span className="text-xs text-muted-foreground">San Francisco, CA</span>
							</div>
						</div>
					</div>
				</HoverCardContent>
			</HoverCard>
		</div>
	);
}

function InputOTPDemo() {
	return (
		<InputOTP maxLength={6}>
			<InputOTPGroup>
				<InputOTPSlot index={0} />
				<InputOTPSlot index={1} />
				<InputOTPSlot index={2} />
			</InputOTPGroup>
			<InputOTPSeparator />
			<InputOTPGroup>
				<InputOTPSlot index={3} />
				<InputOTPSlot index={4} />
				<InputOTPSlot index={5} />
			</InputOTPGroup>
		</InputOTP>
	);
}

function NavigationMenuDemo() {
	return (
		<NavigationMenu>
			<NavigationMenuList>
				<NavigationMenuItem>
					<NavigationMenuTrigger>Getting Started</NavigationMenuTrigger>
					<NavigationMenuContent>
						<ul className="grid gap-3 p-6 w-[400px]">
							<li className="rounded-md border p-3 hover:bg-muted cursor-pointer">
								<div className="flex items-center gap-2 mb-1">
									<BookOpenIcon className="size-4" />
									<span className="text-sm font-medium">Introduction</span>
								</div>
								<p className="text-xs text-muted-foreground">Quick introduction</p>
							</li>
							<li className="rounded-md border p-3 hover:bg-muted cursor-pointer">
								<div className="flex items-center gap-2 mb-1">
									<BoxesIcon className="size-4" />
									<span className="text-sm font-medium">Installation</span>
								</div>
								<p className="text-xs text-muted-foreground">How to install</p>
							</li>
						</ul>
					</NavigationMenuContent>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuTrigger>Components</NavigationMenuTrigger>
					<NavigationMenuContent>
						<ul className="grid gap-3 p-6 w-[400px]">
							<li className="rounded-md border p-3 hover:bg-muted cursor-pointer">
								<div className="flex items-center gap-2 mb-1">
									<BoldIcon className="size-4" />
									<span className="text-sm font-medium">Button</span>
								</div>
								<p className="text-xs text-muted-foreground">Interactive elements</p>
							</li>
							<li className="rounded-md border p-3 hover:bg-muted cursor-pointer">
								<div className="flex items-center gap-2 mb-1">
									<LayoutDashboardIcon className="size-4" />
									<span className="text-sm font-medium">Card</span>
								</div>
								<p className="text-xs text-muted-foreground">Content containers</p>
							</li>
						</ul>
					</NavigationMenuContent>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuLink className={navigationMenuTriggerStyle()}>
						Documentation
					</NavigationMenuLink>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
}

function PopoverDemo() {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline">Open Popover</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80">
				<div className="space-y-2">
					<h4 className="font-medium leading-none">Dimensions</h4>
					<p className="text-sm text-muted-foreground">Set the dimensions for the layer.</p>
					<div className="grid gap-2">
						<Input defaultValue="100%" />
						<Input defaultValue="100px" />
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}

function ProgressDemo() {
	const [value, setValue] = useState(45);
	return (
		<div className="space-y-4 w-full max-w-md">
			<Progress value={value} className="w-full" />
			<div className="flex gap-2">
				<Button size="sm" onClick={() => setValue(Math.max(0, value - 10))}>
					-10
				</Button>
				<Button size="sm" onClick={() => setValue(Math.min(100, value + 10))}>
					+10
				</Button>
				<span className="text-sm text-muted-foreground ml-auto">{value}%</span>
			</div>
		</div>
	);
}

function RadioGroupDemo() {
	return (
		<RadioGroup defaultValue="option-one">
			<div className="flex items-center space-x-2">
				<RadioGroupItem value="option-one" id="r1" />
				<Label htmlFor="r1">Option One</Label>
			</div>
			<div className="flex items-center space-x-2">
				<RadioGroupItem value="option-two" id="r2" />
				<Label htmlFor="r2">Option Two</Label>
			</div>
			<div className="flex items-center space-x-2">
				<RadioGroupItem value="option-three" id="r3" />
				<Label htmlFor="r3">Option Three (disabled)</Label>
			</div>
		</RadioGroup>
	);
}

function ScrollAreaDemo() {
	return (
		<ScrollArea className="h-[200px] w-full rounded-md border">
			<div className="p-4">
				<h4 className="mb-4 text-sm font-medium leading-none">Scroll Area</h4>
				<div className="space-y-4">
					{Array.from({ length: 20 }).map((_, i) => (
						<div key={i} className="text-sm">
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
							incididunt ut labore et dolore magna aliqua.
						</div>
					))}
				</div>
			</div>
			<ScrollBar orientation="vertical" />
		</ScrollArea>
	);
}

function SelectDemo() {
	const [value, setValue] = useState("s1");
	return (
		<Select value={value} onValueChange={setValue}>
			<SelectTrigger className="w-full max-w-xs">
				<SelectValue placeholder="Select a fruit" />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectLabel>Fruits</SelectLabel>
					<SelectItem value="s1">Apple</SelectItem>
					<SelectItem value="s2">Banana</SelectItem>
					<SelectItem value="s3">Blueberry</SelectItem>
					<SelectItem value="s4">Grapes</SelectItem>
					<SelectItem value="s5">Pineapple</SelectItem>
				</SelectGroup>
				<SelectSeparator />
				<SelectGroup>
					<SelectLabel>Vegetables</SelectLabel>
					<SelectItem value="s6">Aubergine</SelectItem>
					<SelectItem value="s7">Broccoli</SelectItem>
					<SelectItem value="s8">Carrot</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

function SheetDemo() {
	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button>Open Sheet</Button>
			</SheetTrigger>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Sheet Title</SheetTitle>
					<SheetDescription>This is a sheet component for overlaying content.</SheetDescription>
				</SheetHeader>
				<div className="mt-6 space-y-4">
					<Button className="w-full">Action 1</Button>
					<Button variant="secondary" className="w-full">
						Action 2
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	);
}

function SliderDemo() {
	const [value, setValue] = useState([50]);
	return (
		<div className="space-y-4 w-full max-w-md">
			<Slider value={value} onValueChange={setValue} max={100} step={1} />
			<div className="flex justify-between text-sm text-muted-foreground">
				<span>0</span>
				<span>Value: {value}</span>
				<span>100</span>
			</div>
		</div>
	);
}

function SwitchDemo() {
	const [checked, setChecked] = useState(true);
	return (
		<div className="flex items-center gap-4">
			<Switch checked={checked} onCheckedChange={setChecked} id="airplane-mode" />
			<Label htmlFor="airplane-mode">Airplane Mode</Label>
		</div>
	);
}

function TabsDemo() {
	const [selectedTab, setSelectedTab] = useState("tab1");
	return (
		<Tabs defaultValue="tab1" value={selectedTab} onValueChange={setSelectedTab}>
			<TabsList>
				<TabsTrigger value="tab1">Account</TabsTrigger>
				<TabsTrigger value="tab2">Password</TabsTrigger>
				<TabsTrigger value="tab3">Settings</TabsTrigger>
			</TabsList>
			<TabsContent value="tab1">
				<Card>
					<CardHeader>
						<CardTitle>Account</CardTitle>
						<CardDescription>Make changes to your account here.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input id="name" defaultValue="Alice Johnson" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="username">Username</Label>
							<Input id="username" defaultValue="@alice" />
						</div>
					</CardContent>
					<CardFooter>
						<Button onClick={() => setSelectedTab("tab2")}>Save changes</Button>
					</CardFooter>
				</Card>
			</TabsContent>
			<TabsContent value="tab2">
				<Card>
					<CardHeader>
						<CardTitle>Password</CardTitle>
						<CardDescription>Update your password here.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="current">Current Password</Label>
							<Input id="current" type="password" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="new">New Password</Label>
							<Input id="new" type="password" />
						</div>
					</CardContent>
					<CardFooter>
						<Button>Update password</Button>
					</CardFooter>
				</Card>
			</TabsContent>
			<TabsContent value="tab3">
				<Card>
					<CardHeader>
						<CardTitle>Settings</CardTitle>
						<CardDescription>Manage your preferences.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-4">
							<BellIcon className="size-5" />
							<div className="flex-1">
								<p className="font-medium">Push Notifications</p>
								<p className="text-sm text-muted-foreground">
									Receive notifications on your device.
								</p>
							</div>
							<Toggle aria-label="Toggle notifications">
								<BellIcon className="size-4" />
							</Toggle>
						</div>
					</CardContent>
				</Card>
			</TabsContent>
		</Tabs>
	);
}

function TextareaDemo() {
	return (
		<div className="w-full max-w-md space-y-2">
			<Textarea placeholder="Type your message here." />
			<div className="flex justify-end">
				<Button size="sm">Send Message</Button>
			</div>
		</div>
	);
}

function RouteComponent() {
	const [openItems, setOpenItems] = useState<string[]>([]);

	const toggleItem = (id: string) => {
		setOpenItems((prev) =>
			prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
		);
	};

	return (
		<div className="flex-1 overflow-auto p-6">
			<div className="mx-auto max-w-4xl space-y-6">
				<div>
					<h1 className="text-3xl font-bold">Components</h1>
					<p className="mt-2 text-muted-foreground">
						A collection of UI components built with Radix UI and Tailwind CSS.
					</p>
				</div>

				<div className="rounded-lg border bg-card">
					{components.map((component, index) => (
						<Collapsible
							key={component.id}
							open={openItems.includes(component.id)}
							onOpenChange={() => toggleItem(component.id)}
						>
							<div className={index !== components.length - 1 ? "border-b" : ""}>
								<CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors">
									<div>
										<h3 className="font-medium">{component.title}</h3>
										<p className="text-sm text-muted-foreground">{component.description}</p>
									</div>
									<ChevronDownIcon
										className={`size-5 transition-transform ${openItems.includes(component.id) ? "rotate-180" : ""}`}
									/>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<div className="border-t p-4 bg-muted/30">{component.content}</div>
								</CollapsibleContent>
							</div>
						</Collapsible>
					))}
				</div>
			</div>
		</div>
	);
}
