<div className="flex gap-2 justify-between items-center">
                                                      <div className="flex items-center">
                                                          <label 
                                                              htmlFor={`edit-file-input-${comment.id}`}
                                                              className="inline-flex h-7 px-2 items-center justify-center rounded-md border border-input bg-transparent text-[10px] font-medium shadow-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-muted-foreground hover:text-primary gap-1.5"
                                                              title="Attach more files"
                                                          >
                                                              <Paperclip className="h-3.5 w-3.5" />
                                                              <span>Add files</span>
                                                          </label>
                                                          <input 
                                                              id={`edit-file-input-${comment.id}`}
                                                              type="file" 
                                                              className="hidden" 
                                                              multiple
                                                              onChange={(e) => {
                                                                  if (e.target.files && e.target.files.length > 0) {
                                                                      setEditNewFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
                                                                  }
                                                                  // Reset value to allow re-selection
                                                                  e.target.value = '';
                                                              }} 
                                                          />
                                                      </div>
                                                      <div className="flex gap-2">