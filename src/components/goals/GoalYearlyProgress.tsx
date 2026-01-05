) : (
                                              <div className="p-2 bg-muted/50 rounded-lg text-xs break-words relative group">
                                                  {renderCommentContent(comment.content)}
                                                  {comment.attachments_jsonb && comment.attachments_jsonb.length > 0 && (
                                                      <div className="mt-2 pt-1 border-t border-border/50 flex flex-wrap gap-2">
                                                          {/* Viewing logic: Show all items to avoid confusion about missing uploads */}
                                                          {comment.attachments_jsonb.map((att: any, idx: number) => (
                                                              <div key={idx} className="w-[70px]">
                                                                  {att.type?.startsWith('image/') ? (
                                                                      <div className="aspect-square rounded-md overflow-hidden border border-border/50 bg-background hover:opacity-90 transition-opacity">
                                                                          <a href={att.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center">
                                                                              <img 
                                                                                src={att.url} 
                                                                                alt={att.name} 
                                                                                className="w-full h-full object-cover" 
                                                                                loading="lazy"
                                                                              />
                                                                          </a>
                                                                      </div>
                                                                  ) : (
                                                                      <div className="aspect-square rounded-md overflow-hidden border border-border/50 bg-muted/30 hover:opacity-90 transition-opacity">
                                                                          <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center w-full h-full p-2 text-center">
                                                                              {att.type === 'application/pdf' ? (
                                                                                  <FileText className="h-8 w-8 text-red-500 mb-1" />
                                                                              ) : (
                                                                                  <Paperclip className="h-8 w-8 text-muted-foreground mb-1" />
                                                                              )}
                                                                              <span className="text-[9px] text-muted-foreground w-full truncate px-1">
                                                                                  {att.name}
                                                                              </span>
                                                                          </a>
                                                                      </div>
                                                                  )}
                                                              </div>
                                                          ))}
                                                      </div>
                                                  )}
                                                  {user?.id === comment.user_id && (
                                                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">