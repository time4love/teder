"use client";

import * as React from "react";
import {
  Command as CommandPrimitive,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "cmdk";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-zinc-950 text-white",
      className,
    )}
    {...props}
  />
));
Command.displayName = "Command";

const CommandInputWrapper = React.forwardRef<
  React.ElementRef<typeof CommandInput>,
  React.ComponentPropsWithoutRef<typeof CommandInput>
>(({ className, ...props }, ref) => (
  <div
    className="flex flex-row-reverse items-center gap-2 border-b border-zinc-800 px-3"
    cmdk-input-wrapper=""
    dir="rtl"
  >
    <Search className="size-4 shrink-0 text-zinc-500" aria-hidden />
    <CommandInput
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md bg-transparent py-3 text-sm text-white outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  </div>
));
CommandInputWrapper.displayName = "CommandInputWrapper";

const CommandListStyled = React.forwardRef<
  React.ElementRef<typeof CommandList>,
  React.ComponentPropsWithoutRef<typeof CommandList>
>(({ className, ...props }, ref) => (
  <CommandList
    ref={ref}
    className={cn("max-h-[280px] overflow-y-auto overflow-x-hidden p-1", className)}
    {...props}
  />
));
CommandListStyled.displayName = "CommandList";

const CommandEmptyStyled = React.forwardRef<
  React.ElementRef<typeof CommandEmpty>,
  React.ComponentPropsWithoutRef<typeof CommandEmpty>
>(({ className, ...props }, ref) => (
  <CommandEmpty
    ref={ref}
    className={cn("py-6 text-center text-sm text-zinc-500", className)}
    {...props}
  />
));
CommandEmptyStyled.displayName = "CommandEmpty";

const CommandGroupStyled = React.forwardRef<
  React.ElementRef<typeof CommandGroup>,
  React.ComponentPropsWithoutRef<typeof CommandGroup>
>(({ className, ...props }, ref) => (
  <CommandGroup
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-white [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-zinc-500",
      className,
    )}
    {...props}
  />
));
CommandGroupStyled.displayName = "CommandGroup";

const CommandItemStyled = React.forwardRef<
  React.ElementRef<typeof CommandItem>,
  React.ComponentPropsWithoutRef<typeof CommandItem>
>(({ className, ...props }, ref) => (
  <CommandItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-white outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-zinc-800 data-[disabled=true]:opacity-50",
      className,
    )}
    {...props}
  />
));
CommandItemStyled.displayName = "CommandItem";

const CommandSeparatorStyled = React.forwardRef<
  React.ElementRef<typeof CommandSeparator>,
  React.ComponentPropsWithoutRef<typeof CommandSeparator>
>(({ className, ...props }, ref) => (
  <CommandSeparator
    ref={ref}
    className={cn("-mx-1 h-px bg-zinc-800", className)}
    {...props}
  />
));
CommandSeparatorStyled.displayName = "CommandSeparator";

export {
  Command,
  CommandInputWrapper as CommandInput,
  CommandListStyled as CommandList,
  CommandEmptyStyled as CommandEmpty,
  CommandGroupStyled as CommandGroup,
  CommandItemStyled as CommandItem,
  CommandSeparatorStyled as CommandSeparator,
};
