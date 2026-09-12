import { useState, useEffect } from "react";
import styled from "styled-components";
import { Button, Input, FormField, Label, Textarea } from "../styles";

const categories = ["Notes", "Tasks", "Workouts", "Journal"];

function parseNoteTitle(rawTitle) {
  const match = rawTitle.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (!match) {
    return { category: "Notes", title: rawTitle };
  }
  return { category: match[1], title: match[2] || "Untitled" };
}

function NotesPage({ user }) {
  const [notes, setNotes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Notes");
  const [selectedId, setSelectedId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  function fetchNotes(nextPage = 1) {
    setLoading(true);
    fetch(`/notes?page=${nextPage}&per_page=3`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Unable to load notes");
        return r.json();
      })
      .then((data) => {
        setNotes(data.items || []);
        setPage(data.page || 1);
        setLastPage(data.pages || 1);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load notes.");
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchNotes(1);
  }, []);

  function resetForm() {
    setSelectedId(null);
    setTitle("");
    setContent("");
  }

  function handleEdit(note) {
    const parsed = parseNoteTitle(note.title);
    setSelectedId(note.id);
    setSelectedCategory(parsed.category);
    setTitle(parsed.title);
    setContent(note.content);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    const payload = {
      title: `[${selectedCategory}] ${title.trim()}`,
      content: content.trim(),
    };

    const request = selectedId
      ? fetch(`/notes/${selectedId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
      : fetch("/notes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

    request
      .then((r) => {
        if (!r.ok) throw new Error("Unable to save note");
        return r.json();
      })
      .then(() => {
        resetForm();
        fetchNotes(page);
      })
      .catch(() => {
        setError("Could not save this note.");
      });
  }

  function handleDelete(id) {
    if (!window.confirm("Delete this entry?")) return;

    fetch(`/notes/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Delete failed");
        return r.json();
      })
      .then(() => {
        resetForm();
        fetchNotes(page);
      })
      .catch(() => {
        setError("Could not delete this note.");
      });
  }

  function filteredNotes() {
    return notes.filter((note) => parseNoteTitle(note.title).category === selectedCategory);
  }

  return (
    <Page>
      <Header>
        <div>
          <Eyebrow>Welcome, {user?.username}</Eyebrow>
          <Title>My Notes</Title>
        </div>
      </Header>

      <CategoryBar>
        {categories.map((category) => (
          <CategoryButton
            key={category}
            type="button"
            active={selectedCategory === category}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </CategoryButton>
        ))}
      </CategoryBar>

      <Grid>
        <Panel>
          <PanelTitle>{selectedId ? "Edit entry" : "New entry"}</PanelTitle>
          <form onSubmit={handleSubmit}>
            <FormField>
              <Label>Category</Label>
              <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField>
              <Label>Title</Label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </FormField>
            <FormField>
              <Label>Content</Label>
              <Textarea
                rows="5"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </FormField>
            {error ? <ErrorText>{error}</ErrorText> : null}
            <ActionRow>
              <Button type="submit">{selectedId ? "Update" : "Create"}</Button>
              {selectedId ? (
                <Button variant="outline" type="button" onClick={resetForm}>
                  Cancel
                </Button>
              ) : null}
            </ActionRow>
          </form>
        </Panel>

        <Panel>
          <PanelTitle>{selectedCategory}</PanelTitle>
          {loading ? <Muted>Loading entries...</Muted> : null}
          {!loading && filteredNotes().length === 0 ? (
            <Muted>No entries in this category yet.</Muted>
          ) : null}
          {!loading &&
            filteredNotes().map((note) => {
              const parsed = parseNoteTitle(note.title);
              return (
                <NoteCard key={note.id}>
                  <NoteMeta>
                    <strong>{parsed.title}</strong>
                    <span>{parsed.category}</span>
                  </NoteMeta>
                  <NoteContent>{note.content}</NoteContent>
                  <NoteActions>
                    <Button variant="outline" type="button" onClick={() => handleEdit(note)}>
                      Edit
                    </Button>
                    <Button type="button" onClick={() => handleDelete(note.id)}>
                      Delete
                    </Button>
                  </NoteActions>
                </NoteCard>
              );
            })}

          <Pagination>
            <Button type="button" variant="outline" disabled={page <= 1} onClick={() => fetchNotes(page - 1)}>
              Previous
            </Button>
            <PageLabel>
              Page {page} / {lastPage}
            </PageLabel>
            <Button type="button" variant="outline" disabled={page >= lastPage} onClick={() => fetchNotes(page + 1)}>
              Next
            </Button>
          </Pagination>
        </Panel>
      </Grid>
    </Page>
  );
}

const Page = styled.div`
  max-width: 1100px;
  margin: 24px auto;
  padding: 0 16px 40px;
`;

const Header = styled.header`
  margin-bottom: 16px;
`;

const Eyebrow = styled.p`
  margin: 0 0 6px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: #666;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 2rem;
`;

const CategoryBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0 24px;
`;

const CategoryButton = styled.button`
  border: 1px solid #d0d7de;
  background: ${(props) => (props.active ? "#ff5ca8" : "#fff")};
  color: ${(props) => (props.active ? "#fff" : "#222")};
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 600;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 20px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.section`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
`;

const PanelTitle = styled.h3`
  margin: 0 0 16px;
  font-size: 1.2rem;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 12px;
`;

const ErrorText = styled.p`
  color: #b42318;
  margin: 8px 0 0;
`;

const Muted = styled.p`
  color: #666;
  margin: 0;
`;

const NoteCard = styled.article`
  border: 1px solid #ececec;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 12px;
  background: #f9fafb;
`;

const NoteMeta = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
`;

const NoteContent = styled.p`
  margin: 0 0 12px;
  white-space: pre-wrap;
  line-height: 1.5;
`;

const NoteActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  gap: 10px;
`;

const PageLabel = styled.span`
  font-weight: 600;
  color: #444;
`;

const Select = styled.select`
  display: block;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d0d7de;
  border-radius: 8px;
  font-size: 1rem;
`;

export default NotesPage;
