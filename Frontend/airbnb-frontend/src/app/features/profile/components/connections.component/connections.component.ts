import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { Connection } from '../../models/user.model';
import { NgFor } from '@angular/common';
@Component({
  selector: 'app-connections',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './connections.component.html',
  styleUrls: ['./connections.component.css']
})
export class ConnectionsComponent implements OnInit {
  connections: Connection[] = [];
  isLoading = true;

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadConnections();
  }

  loadConnections() {
    this.isLoading = true;
    this.userService.getConnections().subscribe({
      next: (data) => {
        this.connections = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading connections:', err);
        this.isLoading = false;
      }
    });
  }

  openConnection(conn: Connection) {
    // Example navigation to connection profile (adjust route if needed)
    this.router.navigate(['/profile/connections', conn.id]);
  }
}
