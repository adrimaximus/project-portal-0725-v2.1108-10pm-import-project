return (
  <DialogContent className="w-[90vw] max-w-[650px] grid grid-rows-[auto_1fr] max-h-[85vh] p-0 rounded-lg overflow-hidden">
    {/* HEADER */}
    <DialogHeader className="p-3 sm:p-4 border-b-[3px] border-primary bg-background z-10">
      <div className="flex justify-between items-start gap-2 sm:gap-4">
        <div className="flex-1 min-w-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            {task.originTicketId && <Ticket className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />}
            {allAttachments.length > 0 && (
              <Paperclip className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-muted-foreground" />
            )}
            <span
              className={cn(
                'min-w-0 break-words',
                task.completed && 'line-through text-muted-foreground'
              )}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: 'span' }}>
                {formatTaskText(task.title)}
              </ReactMarkdown>
            </span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Created on {format(new Date(task.created_at), 'MMM d, yyyy')}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => { onEdit(task); onClose(); }}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleCopyLink}>
              <LinkIcon className="mr-2 h-4 w-4" /> Copy Link
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={handleSendReminder}
              disabled={!isOverdue(task.due_date) || task.completed || isSendingReminder}
            >
              <BellRing className="mr-2 h-4 w-4" /> Send Reminder
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => { onDelete(task.id); onClose(); }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </DialogHeader>

    {/* BODY */}
    <ScrollArea className="relative h-full">
      <div
        ref={scrollRef}
        className="ScrollAreaViewport h-full w-full overflow-y-auto p-4 space-y-4 cursor-grab active:cursor-grabbing select-none"
      >
        {task.description && (
          <div className="border-b pb-4">
            <h4 className="font-semibold mb-2 text-sm">Description</h4>
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground break-all">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {formatTaskText(task.description)}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {allAttachments.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
              <Paperclip className="h-4 w-4" /> Attachments
            </h4>
            <TaskAttachmentList attachments={allAttachments} />
          </div>
        )}

        <div className="border-t pt-4">
          <TaskDiscussion task={task} onToggleReaction={handleToggleReaction} />
        </div>
      </div>
    </ScrollArea>
  </DialogContent>
);
