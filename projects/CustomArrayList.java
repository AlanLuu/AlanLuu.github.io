import java.util.*;

/**
 * Custom reimplementation of java.util.ArrayList.
 */ 
@SuppressWarnings("unchecked")
public class CustomArrayList<E> implements Iterable<E> {
    private int size = 0;
    private E[] data;

    public CustomArrayList() {
        data = (E[]) new Object[10];
    }
    
    public CustomArrayList(int initialCapacity) {
        data = (E[]) new Object[initialCapacity];
    }

    public boolean add(E element) {
        if (size == data.length) {
            expand();
        }
        try {
			data[size++] = element;
			return true;
		} catch (Exception err) {
			return false;
		}
    }

    public void add(int index, E element) {
        if (size == data.length) {
            expand();
        }
        System.arraycopy(data, index, data, index + 1,
                size - index);
        data[index] = element;
        size++;
    }

	public void clear() {
		data = (E[]) new Object[10];
		size = 0;
	}

    public E remove(int index) {
        check(index);
		E e = data[index];
        fastRemove(index);
		return e;
    }

	/*
		Removes the first occurrence of the specified element from this list, if it is present.
	*/
    public boolean remove(Object o) {
		int index = indexOf(o);
		if (index >= 0) {
			fastRemove(index);
			return true;
		}
		return false;
    }

	/*
		Removes all occurrences of the specified element from this list, if it is present.
	*/
	public boolean removeAll(Object o) {
		int index = indexOf(o);
		boolean flag = false;
		while (index >= 0) {
			flag = true;
			fastRemove(index);
			index = indexOf(o);
		}
		return flag;
	}

    public E get(int index) {
        check(index);
        return data[index];
    }

    public int size() {
        return size;
    }

    public boolean contains(Object o) {
        return indexOf(o) >= 0;
    }

    public int indexOf(Object o) {
        for (int i = 0; i < size; i++) {
            if ((o == null && data[i] == null) || (o != null && o.equals(data[i]))) {
                return i;
            }
        }
        return -1;
    }

	public Object[] toArray() {
		Object[] o = new Object[size];
		System.arraycopy(data, 0, o, 0, size);
		return o;
	}

	/*
		PRIVATE HELPER METHODS
	*/
    private void expand() {
        data = Arrays.copyOf(data, data.length * 2);
    }

    private void fastRemove(int index) {
        int numMoved = size - index - 1;
        if (numMoved > 0) {
            System.arraycopy(data, index + 1, data, index, numMoved);
        }
        data[--size] = null;
    }

    private void check(int index) {
        if (index < 0 || index > size - 1) {
            throw new ArrayIndexOutOfBoundsException("Index: " + index + ", Size " + index);
        }
    }

	/*
		Returns a string representation of the CustomArrayList
	*/
    @Override
    public String toString() {
        StringBuilder builder = new StringBuilder()
                .append("[");
		Iterator<E> iterator = iterator();
		while (iterator.hasNext()) {
			E element = iterator.next();
            builder.append(element);
            if (iterator.hasNext()) {
                builder.append(", ");
            }
		}
		builder.append("]");
		return builder.toString();
    }

	/*
		Allows the CustomArrayList to be a target of the for-each loop
	*/
    @Override
    public Iterator<E> iterator() {
        return new Iterator<E>() {
            private int current = 0;

            @Override
            public boolean hasNext() {
                return current < CustomArrayList.this.size;
            }

            @Override
            public E next() {
                if (!hasNext()) {
                    throw new NoSuchElementException();
                }
                return data[current++];
            }

			@Override
            public void remove() {
                throw new UnsupportedOperationException("remove");
            }
        };
    }
}