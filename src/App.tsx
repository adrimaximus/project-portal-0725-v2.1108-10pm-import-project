import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProjectDetailPage from './pages/ProjectDetailPage';
import RequestProjectPage from './pages/RequestProjectPage';
import { dummyProjects, Project } from './data/projects';
import { dummyComments } from './data/comments';
import { Comment } from './components/ProjectComments';

function App() {
  const [projects, setProjects] = useState<Project[]>(dummyProjects);
  const [comments, setComments] = useState<Comment[]>(dummyComments);

  // Function to initialize ticket counts based on comments
  useEffect(() => {
    const ticketCounts = comments.reduce((acc, comment) => {
      if (comment.isTicket) {
        acc[comment.projectId] = (acc[comment.projectId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    setProjects(prevProjects =>
      prevProjects.map(p => ({
        ...p,
        tickets: ticketCounts[p.id] || p.tickets || 0,
      }))
    );
  }, []); // Runs only once on initial load

  const handleAddComment = (newCommentData: Omit<Comment, 'id' | 'timestamp'>) => {
    const newComment: Comment = {
      ...newCommentData,
      id: Date.now(),
      timestamp: 'Just now',
    };

    setComments(prev => [...prev, newComment]);

    if (newComment.isTicket) {
      setProjects(prevProjects => 
        prevProjects.map(p => 
          p.id === newComment.projectId 
            ? { ...p, tickets: (p.tickets || 0) + 1 }
            : p
        )
      );
    }
  };

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard projects={projects} />} />
          <Route 
            path="/projects/:projectId" 
            element={
              <ProjectDetailPage 
                projects={projects} 
                comments={comments} 
                onAddComment={handleAddComment}
                setProjects={setProjects}
              />
            } 
          />
          <Route path="/request" element={<RequestProjectPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;