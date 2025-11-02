return (
  <DialogContent className="w-[90vw] max-w-[650px] grid grid-rows-[auto_1fr] max-h-[85vh] p-0 rounded-lg">
    {/* HEADER */}
    <DialogHeader className="p-3 sm:p-4 border-b-[3px] border-primary sticky top-0 bg-background z-10">
      <div className="flex justify-between items-start gap-2 sm:gap-4">
        <div className="flex-1 min-w-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            {task.originTicketId && <Ticket className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />}
            {allAttachments.length > 0 && <Paperclip className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-muted-foreground" />}
            <span className={cn("min-w-0 break-words", task.completed && 'line-through text-muted-foreground')}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: 'span' }}>
                {formatTaskText(task.title)}
              </ReactMarkdown>
            </span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Created on {format(new Date(task.created_at), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-0 sm:gap-1 flex-shrink-0">
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
              <DropdownMenuItem onSelect={handleSendReminder} disabled={!isOverdue(task.due_date) || task.completed || isSendingReminder}>
                <BellRing className="mr-2 h-4 w-4" /> Send Reminder
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => { onDelete(task.id); onClose(); }} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </DialogHeader>

    {/* SCROLL AREA */}
    <div className="overflow-y-auto h-full">
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 text-xs sm:text-sm pb-6">
        {/* semua konten yang sebelumnya ada di sini */}
        {/* Description, grid project info, tags, attachments, TaskDiscussion, dll */}
      </div>
    </div>
  </DialogContent>
);
